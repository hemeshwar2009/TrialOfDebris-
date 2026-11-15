// Supabase Edge Function: td-auth
// Server side of Trail of Debris accounts:
//   • WebAuthn passkey registration + login (@simplewebauthn/server)
//   • Passkey → Supabase session bridge (verified assertion → one-time magic-link token)
//   • Account deletion
//   • Admin actions (ban / unban / delete)
//
// Deploy with "Verify JWT" OFF: login actions are public. Every other action
// verifies the caller's Supabase access token itself.
//
// No biometric data ever reaches this server: the device does the face /
// fingerprint / PIN check and only sends a signed public-key assertion.

import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2.52.1";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "npm:@simplewebauthn/server@13.3.2";
import { isoBase64URL } from "npm:@simplewebauthn/server@13.3.2/helpers";

const RP_NAME = "Trail of Debris";
// Origins allowed to use passkeys, mapped to their relying-party ID.
// Passkeys are bound to the RP ID, so ones created on localhost only work on localhost.
const ALLOWED_ORIGINS: Record<string, string> = {
  "https://hemeshwar2009.github.io": "hemeshwar2009.github.io",
  "http://localhost:5181": "localhost",
  "http://localhost:5180": "localhost",
  "http://localhost:8080": "localhost",
};
const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const MAX_CHALLENGES_PER_IP_PER_MIN = 15;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin: SupabaseClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS[origin] ? origin : "https://hemeshwar2009.github.io";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

function rpFor(origin: string | null): string {
  if (!origin || !ALLOWED_ORIGINS[origin]) throw new HttpError(403, "This site is not allowed to use passkeys.");
  return ALLOWED_ORIGINS[origin];
}

function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
}

async function requireUser(req: Request): Promise<User> {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "Please log in first.");
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "Your session has expired. Please log in again.");
  return data.user;
}

async function requireRegisteredUser(req: Request): Promise<User> {
  const user = await requireUser(req);
  if (user.is_anonymous || !user.email) throw new HttpError(403, "Create an account before adding a passkey.");
  return user;
}

async function requireAdmin(req: Request): Promise<User> {
  const user = await requireUser(req);
  const { data } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (user.is_anonymous || data?.role !== "admin") throw new HttpError(403, "Administrator access required.");
  return user;
}

async function rateLimit(ip: string) {
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await admin.from("webauthn_challenges")
    .select("id", { count: "exact", head: true })
    .eq("client_ip", ip).gte("created_at", since);
  if ((count ?? 0) >= MAX_CHALLENGES_PER_IP_PER_MIN) {
    throw new HttpError(429, "Too many attempts. Please wait a minute and try again.");
  }
}

async function saveChallenge(kind: "registration" | "authentication", challenge: string, rpId: string, ip: string, userId: string | null) {
  await admin.rpc("purge_webauthn_challenges");
  const { data, error } = await admin.from("webauthn_challenges").insert({
    kind, challenge, rp_id: rpId, client_ip: ip, user_id: userId,
    expires_at: new Date(Date.now() + CHALLENGE_TTL_MS).toISOString(),
  }).select("id").single();
  if (error) throw new HttpError(500, "Could not start passkey ceremony.");
  return data.id as string;
}

// Atomically marks a challenge used. Returns null if missing, expired, reused, or for another user.
async function consumeChallenge(id: string, kind: string, userId: string | null) {
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  let q = admin.from("webauthn_challenges")
    .update({ used_at: new Date().toISOString() })
    .eq("id", id).eq("kind", kind).is("used_at", null)
    .gt("expires_at", new Date().toISOString());
  q = userId ? q.eq("user_id", userId) : q.is("user_id", null);
  const { data } = await q.select("challenge, rp_id").maybeSingle();
  return data as { challenge: string; rp_id: string } | null;
}

// ---------------------------------------------------------------- actions

async function registerOptions(req: Request, origin: string | null) {
  const rpId = rpFor(origin);
  const user = await requireRegisteredUser(req);
  await rateLimit(clientIp(req));
  const { data: existing } = await admin.from("passkey_credentials")
    .select("credential_id, transports").eq("user_id", user.id);
  const { data: profile } = await admin.from("profiles").select("username").eq("id", user.id).maybeSingle();

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: rpId,
    userID: new TextEncoder().encode(user.id),
    userName: user.email!,
    userDisplayName: profile?.username || user.email!,
    attestationType: "none",
    excludeCredentials: (existing || []).map((c) => ({ id: c.credential_id, transports: c.transports || undefined })),
    authenticatorSelection: { residentKey: "required", userVerification: "required" },
    timeout: CHALLENGE_TTL_MS,
  });
  const challengeId = await saveChallenge("registration", options.challenge, rpId, clientIp(req), user.id);
  return { options, challengeId };
}

async function registerVerify(req: Request, origin: string | null, body: any) {
  rpFor(origin);
  const user = await requireRegisteredUser(req);
  const ch = await consumeChallenge(body.challengeId, "registration", user.id);
  if (!ch) throw new HttpError(400, "This passkey request expired. Please try again.");

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body.response,
      expectedChallenge: ch.challenge,
      expectedOrigin: origin!,
      expectedRPID: ch.rp_id,
      requireUserVerification: true,
    });
  } catch (e) {
    throw new HttpError(400, "Passkey could not be verified: " + (e as Error).message);
  }
  if (!verification.verified || !verification.registrationInfo) throw new HttpError(400, "Passkey could not be verified.");

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
  const nickname = typeof body.nickname === "string" ? body.nickname.slice(0, 40) : null;
  const { error } = await admin.from("passkey_credentials").insert({
    user_id: user.id,
    credential_id: credential.id,
    public_key: isoBase64URL.fromBuffer(credential.publicKey),
    counter: credential.counter,
    transports: credential.transports || [],
    device_type: credentialDeviceType,
    backed_up: credentialBackedUp,
    nickname,
  });
  if (error) {
    if (error.code === "23505") throw new HttpError(409, "This passkey is already registered.");
    throw new HttpError(500, "Could not save passkey.");
  }
  return { verified: true };
}

async function loginOptions(req: Request, origin: string | null) {
  const rpId = rpFor(origin);
  const ip = clientIp(req);
  await rateLimit(ip);
  // Discoverable credentials: the device offers the user's passkeys for this site.
  const options = await generateAuthenticationOptions({
    rpID: rpId,
    userVerification: "required",
    timeout: CHALLENGE_TTL_MS,
  });
  const challengeId = await saveChallenge("authentication", options.challenge, rpId, ip, null);
  return { options, challengeId };
}

async function loginVerify(req: Request, origin: string | null, body: any) {
  rpFor(origin);
  const ch = await consumeChallenge(body.challengeId, "authentication", null);
  if (!ch) throw new HttpError(400, "This login request expired. Please try again.");

  const credId = body?.response?.id;
  if (typeof credId !== "string") throw new HttpError(400, "Invalid passkey response.");
  const { data: cred } = await admin.from("passkey_credentials")
    .select("id, user_id, credential_id, public_key, counter, transports")
    .eq("credential_id", credId).maybeSingle();
  if (!cred) throw new HttpError(401, "This passkey isn't registered. Log in with your password and set up a passkey first.");

  // The authenticator's user handle must match the account the credential belongs to.
  const userHandle = body.response?.response?.userHandle;
  if (userHandle && userHandle !== isoBase64URL.fromBuffer(new TextEncoder().encode(cred.user_id))) {
    throw new HttpError(401, "Passkey does not match this account.");
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body.response,
      expectedChallenge: ch.challenge,
      expectedOrigin: origin!,
      expectedRPID: ch.rp_id,
      credential: {
        id: cred.credential_id,
        publicKey: isoBase64URL.toBuffer(cred.public_key),
        counter: Number(cred.counter),
        transports: cred.transports || undefined,
      },
      requireUserVerification: true,
    });
  } catch (e) {
    throw new HttpError(401, "Passkey could not be verified: " + (e as Error).message);
  }
  if (!verification.verified) throw new HttpError(401, "Passkey could not be verified.");

  await admin.from("passkey_credentials").update({
    counter: verification.authenticationInfo.newCounter,
    last_used_at: new Date().toISOString(),
  }).eq("id", cred.id);

  const { data: u, error: uErr } = await admin.auth.admin.getUserById(cred.user_id);
  if (uErr || !u.user) throw new HttpError(401, "Account not found.");
  const user = u.user as User & { banned_until?: string };
  if (user.banned_until && new Date(user.banned_until) > new Date()) throw new HttpError(403, "This account has been suspended.");
  if (!user.email) throw new HttpError(400, "Account has no email address.");
  if (!user.email_confirmed_at) throw new HttpError(403, "Please verify your email address first.");

  // Session bridge: mint a one-time magic-link token server-side (no email is sent).
  // The browser exchanges it with supabase.auth.verifyOtp() for a real Supabase session.
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email: user.email });
  if (linkErr || !link?.properties?.hashed_token) throw new HttpError(500, "Could not create a session.");
  return { token_hash: link.properties.hashed_token, type: "magiclink" };
}

async function deleteAccount(req: Request) {
  const user = await requireUser(req);
  if (!user.is_anonymous) {
    const { data } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (data?.role === "admin") throw new HttpError(403, "Administrators must be removed by the project owner.");
  }
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) throw new HttpError(500, "Could not delete the account.");
  return { deleted: true };
}

async function adminAction(req: Request, body: any) {
  const caller = await requireAdmin(req);
  const target = body.userId;
  if (typeof target !== "string" || !/^[0-9a-f-]{36}$/i.test(target)) throw new HttpError(400, "Invalid user.");
  if (target === caller.id) throw new HttpError(400, "You can't do that to your own account.");
  const { data: prof } = await admin.from("profiles").select("role").eq("id", target).maybeSingle();
  if (prof?.role === "admin") throw new HttpError(403, "Other administrators can't be changed here.");

  if (body.op === "ban" || body.op === "unban") {
    const { error } = await admin.auth.admin.updateUserById(target, { ban_duration: body.op === "ban" ? "876000h" : "none" });
    if (error) throw new HttpError(500, "Could not update the account.");
    return { ok: true };
  }
  if (body.op === "delete") {
    const { error } = await admin.auth.admin.deleteUser(target);
    if (error) throw new HttpError(500, "Could not delete the account.");
    return { ok: true };
  }
  throw new HttpError(400, "Unknown admin action.");
}

// ---------------------------------------------------------------- router

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);

  try {
    const body = await req.json().catch(() => ({}));
    let result;
    switch (body.action) {
      case "register-options": result = await registerOptions(req, origin); break;
      case "register-verify": result = await registerVerify(req, origin, body); break;
      case "login-options": result = await loginOptions(req, origin); break;
      case "login-verify": result = await loginVerify(req, origin, body); break;
      case "delete-account": result = await deleteAccount(req); break;
      case "admin": result = await adminAction(req, body); break;
      default: throw new HttpError(400, "Unknown action.");
    }
    return json(result, 200, origin);
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    const message = e instanceof HttpError ? e.message : "Something went wrong.";
    if (!(e instanceof HttpError)) console.error(e);
    return json({ error: message }, status, origin);
  }
});
