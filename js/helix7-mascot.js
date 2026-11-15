/**
 * HELIX-7: Interactive 3D Droid Mascot
 * Built with vanilla Three.js
 * 
 * Features:
 * - White glossy capsule body with violet waist ring, glowing pink chest light & dual vent slots.
 * - Floating hover with flickering amber thruster cone.
 * - Head with dark glossy visor, violet equator band, disc ears, antenna with pulsing pink tip,
 *   and glowing cyan mono-eye that blinks and tracks the mouse cursor.
 * - DNA-style "Data Helix" with 22 cyan beads and 22 pink beads linked by translucent violet rungs.
 * - Talking mode, happy jump-and-spin interaction, chat panel integration.
 * - Cap DPR at 2, respects prefers-reduced-motion, proper GPU resource disposal.
 */

class Helix7Mascot {
  constructor(canvasId = 'helix7-canvas') {
    this.canvas = document.getElementById(canvasId);
    this.width = 150;
    this.height = 180;
    
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animFrameId = null;

    // Mascot 3D components
    this.droidGroup = null;
    this.headGroup = null;
    this.eyeMesh = null;
    this.eyeHighlight = null;
    this.eyeMaterial = null;
    this.thrusterCone = null;
    this.antennaTip = null;
    this.starsGroup = null;
    this.stars = [];

    // Interaction & Animation states
    this.isTalking = false;
    this.isBlinking = false;
    this.blinkTimer = null;
    this.blinkNextTime = 0;
    this.isSpinning = false;
    this.spinStartTime = 0;
    this.spinDuration = 650; // ms

    // Cursor Follow Companion Mode (toggled via double-click)
    this.isFollowingCursor = false;
    this.lastCursorX = window.innerWidth - 100;
    this.lastCursorY = window.innerHeight - 100;
    this.followX = window.innerWidth - 170;
    this.followY = window.innerHeight - 200;
    this.widget = null;
    this.container = null;
    this.holoBox = null;

    // Click & Drag Placement State
    this.isDragging = false;
    this.isMouseDown = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.suppressClick = false;

    // Mouse tracking
    this.mouse = { x: 0, y: 0 };
    this.targetHeadYaw = 0;
    this.targetHeadPitch = 0;

    // Clock & motion settings
    this.clock = new THREE.Clock();
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Track created resources for disposal
    this.geometries = [];
    this.materials = [];

    // Bind event handlers
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onCanvasClick = this.onCanvasClick.bind(this);
    this.onCanvasDblClick = this.onCanvasDblClick.bind(this);
    this.onReducedMotionChange = this.onReducedMotionChange.bind(this);

    this.init();
  }

  init() {
    if (!this.canvas || typeof THREE === 'undefined') {
      console.warn('Three.js or target canvas not found for HELIX-7.');
      return;
    }

    // 1. Scene & Transparent Background
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(40, this.width / this.height, 0.1, 50);
    this.camera.position.set(0, 0.25, 4.4);
    this.camera.lookAt(0, 0.1, 0);

    // 3. Renderer with transparent background and max DPR 2
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 0);

    // 4. Lighting System
    this.setupLighting();

    // 5. Build Droid Geometry & Materials
    this.buildDroid();

    // 6. Build Blinking Orbiting Stars (replaces DNA helix)
    this.buildBlinkingStars();

    // 7. Event Listeners & DOM references
    this.widget = document.getElementById('helix7-widget');
    this.container = document.getElementById('helix7-droid-container');
    this.holoBox = document.getElementById('bb8-holo-box');

    window.addEventListener('mousemove', this.onMouseMove, { passive: true });
    this.canvas.addEventListener('click', this.onCanvasClick);
    this.canvas.addEventListener('dblclick', this.onCanvasDblClick);
    // The canvas itself ignores clicks (css/ux-fixes.css); this body-sized target
    // receives them instead so buttons behind the droid's empty space stay clickable.
    const hit = document.getElementById('helix7-hit');
    if (hit) hit.addEventListener('click', this.onCanvasClick);
    if (this.container) {
      this.container.addEventListener('dblclick', this.onCanvasDblClick);
    }

    // Initialize Click & Drag Screen Placement
    this.initDraggable();
    
    try {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      motionQuery.addEventListener('change', this.onReducedMotionChange);
    } catch (e) {
      // Older browsers
    }

    // Next random blink time
    this.scheduleNextBlink();

    // 8. Start Rendering Loop
    this.clock.start();
    this.animate();
  }

  trackGeo(geo) {
    this.geometries.push(geo);
    return geo;
  }

  trackMat(mat) {
    this.materials.push(mat);
    return mat;
  }

  setupLighting() {
    // Soft ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    // White key light from upper front-right
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.25);
    keyLight.position.set(3, 4, 3.5);
    this.scene.add(keyLight);

    // Cyan rim point light from behind-left
    const cyanRim = new THREE.PointLight(0x22d3ee, 2.8, 10);
    cyanRim.position.set(-3, 2, -2.5);
    this.scene.add(cyanRim);

    // Pink accent glow light from lower front
    const pinkAccent = new THREE.PointLight(0xf472b6, 1.1, 6);
    pinkAccent.position.set(0, -0.4, 2);
    this.scene.add(pinkAccent);
  }

  buildDroid() {
    this.droidGroup = new THREE.Group();
    this.scene.add(this.droidGroup);

    // Base materials
    const whiteBodyMat = this.trackMat(new THREE.MeshStandardMaterial({
      color: 0xeef2ff,
      metalness: 0.35,
      roughness: 0.3
    }));

    const violetMat = this.trackMat(new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      metalness: 0.25,
      roughness: 0.35
    }));

    const darkVisorMat = this.trackMat(new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.85,
      roughness: 0.15
    }));

    const darkMetalMat = this.trackMat(new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.5,
      roughness: 0.5
    }));

    // ==========================================
    // 1. BODY CAPSULE
    // ==========================================
    const bodyGroup = new THREE.Group();
    this.droidGroup.add(bodyGroup);

    let capsuleMesh;
    if (typeof THREE.CapsuleGeometry !== 'undefined') {
      const capGeo = this.trackGeo(new THREE.CapsuleGeometry(0.42, 0.52, 16, 24));
      capsuleMesh = new THREE.Mesh(capGeo, whiteBodyMat);
    } else {
      // Universal fallback for Three.js versions without CapsuleGeometry
      capsuleMesh = new THREE.Group();
      const cylGeo = this.trackGeo(new THREE.CylinderGeometry(0.42, 0.42, 0.52, 24));
      const sphereGeo = this.trackGeo(new THREE.SphereGeometry(0.42, 24, 16));
      
      const cyl = new THREE.Mesh(cylGeo, whiteBodyMat);
      const topHem = new THREE.Mesh(sphereGeo, whiteBodyMat);
      topHem.position.y = 0.26;
      const botHem = new THREE.Mesh(sphereGeo, whiteBodyMat);
      botHem.position.y = -0.26;

      capsuleMesh.add(cyl);
      capsuleMesh.add(topHem);
      capsuleMesh.add(botHem);
    }
    capsuleMesh.position.y = -0.05;
    bodyGroup.add(capsuleMesh);

    // Waist Ring: Violet torus (#8b5cf6)
    const waistRingGeo = this.trackGeo(new THREE.TorusGeometry(0.445, 0.048, 16, 32));
    const waistRing = new THREE.Mesh(waistRingGeo, violetMat);
    waistRing.rotation.x = Math.PI / 2;
    waistRing.position.y = -0.05;
    bodyGroup.add(waistRing);

    // Chest Light: glowing pink circular light (#f472b6, emissive)
    const chestLightGeo = this.trackGeo(new THREE.CylinderGeometry(0.08, 0.08, 0.035, 20));
    this.chestLightMat = this.trackMat(new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      emissive: 0xf472b6,
      emissiveIntensity: 0.95
    }));
    const chestLight = new THREE.Mesh(chestLightGeo, this.chestLightMat);
    chestLight.rotation.x = Math.PI / 2;
    chestLight.position.set(0, 0.14, 0.42);
    bodyGroup.add(chestLight);

    // Two thin dark vertical vent slots below the chest light
    const ventGeo = this.trackGeo(new THREE.BoxGeometry(0.024, 0.12, 0.03));
    const vent1 = new THREE.Mesh(ventGeo, darkVisorMat);
    vent1.position.set(-0.065, -0.01, 0.42);
    const vent2 = new THREE.Mesh(ventGeo, darkVisorMat);
    vent2.position.set(0.065, -0.01, 0.42);
    bodyGroup.add(vent1);
    bodyGroup.add(vent2);

    // Hover Thruster: glowing amber cone (#fbbf24, emissive) under the body
    const thrusterGeo = this.trackGeo(new THREE.ConeGeometry(0.22, 0.38, 20));
    this.thrusterMat = this.trackMat(new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xfbbf24,
      emissiveIntensity: 1.3,
      transparent: true,
      opacity: 0.88
    }));
    this.thrusterCone = new THREE.Mesh(thrusterGeo, this.thrusterMat);
    this.thrusterCone.rotation.z = Math.PI; // point downward
    this.thrusterCone.position.y = -0.68;
    bodyGroup.add(this.thrusterCone);

    // Thruster base ring
    const thrusterRingGeo = this.trackGeo(new THREE.TorusGeometry(0.2, 0.03, 12, 24));
    const thrusterRing = new THREE.Mesh(thrusterRingGeo, violetMat);
    thrusterRing.rotation.x = Math.PI / 2;
    thrusterRing.position.y = -0.48;
    bodyGroup.add(thrusterRing);

    // ==========================================
    // 2. HEAD (SITS ON TOP OF BODY)
    // ==========================================
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.58, 0);
    this.droidGroup.add(this.headGroup);

    // White sphere head
    const headSphereGeo = this.trackGeo(new THREE.SphereGeometry(0.4, 28, 22));
    const headSphere = new THREE.Mesh(headSphereGeo, whiteBodyMat);
    this.headGroup.add(headSphere);

    // Violet band around head equator (#8b5cf6)
    const headBandGeo = this.trackGeo(new THREE.TorusGeometry(0.405, 0.032, 16, 32));
    const headBand = new THREE.Mesh(headBandGeo, violetMat);
    headBand.rotation.x = Math.PI / 2;
    this.headGroup.add(headBand);

    // Dark glossy visor wrapping the front (#0f172a)
    const visorGeo = this.trackGeo(new THREE.CylinderGeometry(0.408, 0.408, 0.26, 24, 1, true, -Math.PI / 2.8, Math.PI / 1.4));
    const visorMesh = new THREE.Mesh(visorGeo, darkVisorMat);
    this.headGroup.add(visorMesh);

    // Violet eye ring holding the eye
    const eyeRingGeo = this.trackGeo(new THREE.TorusGeometry(0.155, 0.024, 16, 24));
    const eyeRing = new THREE.Mesh(eyeRingGeo, violetMat);
    eyeRing.position.set(0, 0.02, 0.38);
    this.headGroup.add(eyeRing);

    // ONE big round glowing cyan eye (#22d3ee, emissive)
    const eyeGeo = this.trackGeo(new THREE.CircleGeometry(0.135, 24));
    this.eyeMaterial = this.trackMat(new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x22d3ee,
      emissiveIntensity: 1.15
    }));
    this.eyeMesh = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    this.eyeMesh.position.set(0, 0.02, 0.39);
    this.headGroup.add(this.eyeMesh);

    // Small white highlight dot as a pupil
    const pupilGeo = this.trackGeo(new THREE.CircleGeometry(0.036, 16));
    const pupilMat = this.trackMat(new THREE.MeshBasicMaterial({ color: 0xffffff }));
    this.eyeHighlight = new THREE.Mesh(pupilGeo, pupilMat);
    this.eyeHighlight.position.set(0.045, 0.065, 0.395);
    this.headGroup.add(this.eyeHighlight);

    // Two small violet disc "ears" on the sides of the head
    const earGeo = this.trackGeo(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 20));
    const leftEar = new THREE.Mesh(earGeo, violetMat);
    leftEar.rotation.z = Math.PI / 2;
    leftEar.position.set(-0.41, 0, 0);
    const rightEar = new THREE.Mesh(earGeo, violetMat);
    rightEar.rotation.z = Math.PI / 2;
    rightEar.position.set(0.41, 0, 0);
    this.headGroup.add(leftEar);
    this.headGroup.add(rightEar);

    // Thin dark antenna tilted slightly to one side
    const antennaStemGeo = this.trackGeo(new THREE.CylinderGeometry(0.015, 0.015, 0.34, 12));
    const antennaStem = new THREE.Mesh(antennaStemGeo, darkMetalMat);
    antennaStem.position.set(0.18, 0.46, -0.04);
    antennaStem.rotation.z = -0.26; // ~15 deg tilt
    this.headGroup.add(antennaStem);

    // Glowing pink ball on the tip (#f472b6, gently pulses)
    const antennaBallGeo = this.trackGeo(new THREE.SphereGeometry(0.065, 16, 16));
    this.antennaTipMat = this.trackMat(new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      emissive: 0xf472b6,
      emissiveIntensity: 1.05
    }));
    this.antennaTip = new THREE.Mesh(antennaBallGeo, this.antennaTipMat);
    this.antennaTip.position.set(0.225, 0.61, -0.04);
    this.headGroup.add(this.antennaTip);
  }

  buildBlinkingStars() {
    this.starsGroup = new THREE.Group();
    this.droidGroup.add(this.starsGroup);
    this.stars = [];

    const starCount = 20; // 20 gleaming orbiting stars
    const starColors = [
      { color: 0xffffff, emissive: 0xffffff },
      { color: 0x22d3ee, emissive: 0x00f0ff },
      { color: 0xf472b6, emissive: 0xec4899 },
      { color: 0xfde047, emissive: 0xfacc15 },
      { color: 0xc084fc, emissive: 0xa855f7 }
    ];

    const octaGeo = this.trackGeo(new THREE.OctahedronGeometry(1, 0));
    const tetraGeo = this.trackGeo(new THREE.TetrahedronGeometry(1, 0));

    for (let i = 0; i < starCount; i++) {
      const col = starColors[i % starColors.length];
      const starMat = this.trackMat(new THREE.MeshStandardMaterial({
        color: col.color,
        emissive: col.emissive,
        emissiveIntensity: 1.4,
        roughness: 0.2,
        metalness: 0.8
      }));

      // Create a 4-point sparkle star using intersecting diamond octahedrons
      const starMesh = new THREE.Group();
      
      const vSpike = new THREE.Mesh(octaGeo, starMat);
      vSpike.scale.set(0.42, 1.35, 0.42);
      starMesh.add(vSpike);

      const hSpike = new THREE.Mesh(octaGeo, starMat);
      hSpike.scale.set(1.15, 0.42, 0.42);
      starMesh.add(hSpike);

      const core = new THREE.Mesh(tetraGeo, starMat);
      core.scale.set(0.55, 0.55, 0.55);
      starMesh.add(core);

      // Distribute from below thruster to above antenna
      const t = i / (starCount - 1);
      const baseY = -0.85 + t * 2.05;
      const radius = 0.68 + (i % 3) * 0.18 + Math.sin(i * 1.5) * 0.1;
      const speed = (0.55 + (i % 4) * 0.22) * (i % 2 === 0 ? 1 : -1);
      const angle = (i / starCount) * Math.PI * 2 + (i * 0.4);

      const starData = {
        mesh: starMesh,
        material: starMat,
        radius: radius,
        angle: angle,
        speed: speed,
        baseY: baseY,
        tiltX: Math.sin(i * 1.7) * 0.28,
        tiltZ: Math.cos(i * 2.1) * 0.28,
        twinkleSpeed: 3.2 + (i % 5) * 1.1,
        twinklePhase: i * 1.25,
        baseScale: 0.048 + (i % 3) * 0.015,
        selfSpinSpeed: (0.03 + (i % 3) * 0.015) * (i % 2 === 0 ? 1 : -1)
      };

      starMesh.scale.setScalar(starData.baseScale);
      this.starsGroup.add(starMesh);
      this.stars.push(starData);
    }
  }

  onMouseMove(e) {
    if (this.reducedMotion) return;
    
    this.lastCursorX = e.clientX;
    this.lastCursorY = e.clientY;

    if (!this.canvas) return;
    
    // Normalize coordinates around the widget's current center
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;

    // Calculate natural target head yaw & pitch
    const maxYaw = 0.55;   // ~30 deg
    const maxPitch = 0.32; // ~18 deg
    
    this.targetHeadYaw = Math.max(-maxYaw, Math.min(maxYaw, (dx / Math.max(window.innerWidth, 800)) * 2.2));
    this.targetHeadPitch = Math.max(-maxPitch, Math.min(maxPitch, (dy / Math.max(window.innerHeight, 600)) * 1.8));
  }

  onCanvasClick() {
    if (this.suppressClick) {
      this.suppressClick = false;
      return;
    }
    this.jumpAndSpin();
    
    // Trigger companion conversation or holographic tip
    if (window.bb8Bot && typeof window.bb8Bot.interact === 'function') {
      window.bb8Bot.interact();
    }
  }

  onCanvasDblClick(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    this.toggleFollowCursor();
  }

  toggleFollowCursor() {
    this.isFollowingCursor = !this.isFollowingCursor;

    if (this.isFollowingCursor) {
      if (this.widget) {
        this.widget.classList.add('following-cursor');
        const rect = this.widget.getBoundingClientRect();
        this.followX = rect.left;
        this.followY = rect.top;
      }
      this.jumpAndSpin();
      if (window.soundEngine && typeof window.soundEngine.playDroidHappy === 'function') {
        window.soundEngine.playDroidHappy();
      }
      if (window.bb8Bot && typeof window.bb8Bot.say === 'function') {
        window.bb8Bot.say("WHEEE-CHIRP! Cursor companion engaged! Moving with your pointer! (Double-click anytime to anchor me)", "happy");
      }
    } else {
      this.dockToCorner();
      if (window.soundEngine && typeof window.soundEngine.playSuccess === 'function') {
        window.soundEngine.playSuccess();
      }
      if (window.bb8Bot && typeof window.bb8Bot.say === 'function') {
        window.bb8Bot.say("BEEP-BOOP! Droid docked at base! Double-click me anytime to guide me with your pointer!", "curious");
      }
    }
  }

  dockToCorner() {
    this.isFollowingCursor = false;
    if (this.widget) {
      this.widget.classList.remove('following-cursor', 'dock-left', 'dock-top', 'is-dragging');
      this.widget.style.left = '';
      this.widget.style.top = '';
      this.widget.style.right = '22px';
      this.widget.style.bottom = '18px';
    }
  }

  initDraggable() {
    this.widget = document.getElementById('helix7-widget');
    this.container = document.getElementById('helix7-droid-container');
    this.holoBox = document.getElementById('bb8-holo-box');

    const onPointerDown = (e) => {
      // Don't drag if clicking interactive buttons inside chat box
      if (e.target && (e.target.closest('.bb8-icon-btn') || e.target.closest('button') || e.target.tagName === 'BUTTON')) {
        return;
      }

      // Only handle primary button for mouse
      if (e.button !== undefined && e.button !== 0) return;

      const isTouch = Boolean(e.touches && e.touches.length > 0);
      const clientX = isTouch ? e.touches[0].clientX : e.clientX;
      const clientY = isTouch ? e.touches[0].clientY : e.clientY;

      if (!this.widget) this.widget = document.getElementById('helix7-widget');
      if (!this.widget) return;

      const rect = this.widget.getBoundingClientRect();

      this.isMouseDown = true;
      this.dragStartX = clientX;
      this.dragStartY = clientY;
      this.dragOffsetX = clientX - rect.left;
      this.dragOffsetY = clientY - rect.top;

      // Cancel cursor follow if active, since operator is manually placing it
      if (this.isFollowingCursor) {
        this.isFollowingCursor = false;
        this.widget.classList.remove('following-cursor');
      }

      window.addEventListener('mousemove', onPointerMove, { passive: false });
      window.addEventListener('mouseup', onPointerUp);
      window.addEventListener('touchmove', onPointerMove, { passive: false });
      window.addEventListener('touchend', onPointerUp);
      window.addEventListener('touchcancel', onPointerUp);
    };

    const onPointerMove = (e) => {
      if (!this.isMouseDown) return;

      const isTouch = Boolean(e.touches && e.touches.length > 0);
      const clientX = isTouch ? e.touches[0].clientX : e.clientX;
      const clientY = isTouch ? e.touches[0].clientY : e.clientY;

      const dist = Math.hypot(clientX - this.dragStartX, clientY - this.dragStartY);

      if (!this.isDragging && dist > 5) {
        this.isDragging = true;
        this.widget.classList.add('is-dragging');
        document.body.classList.add('is-dragging-mascot');
      }

      if (this.isDragging) {
        if (e.cancelable) e.preventDefault();

        const widgetRect = this.widget.getBoundingClientRect();
        const newLeft = clientX - this.dragOffsetX;
        const newTop = clientY - this.dragOffsetY;

        // Keep inside screen viewport
        const maxLeft = Math.max(0, window.innerWidth - widgetRect.width);
        const maxTop = Math.max(0, window.innerHeight - widgetRect.height);
        const clampLeft = Math.max(0, Math.min(maxLeft, newLeft));
        const clampTop = Math.max(0, Math.min(maxTop, newTop));

        this.widget.style.left = `${clampLeft.toFixed(1)}px`;
        this.widget.style.top = `${clampTop.toFixed(1)}px`;
        this.widget.style.right = 'auto';
        this.widget.style.bottom = 'auto';

        // Adapt holographic chat orientation depending on placement on screen
        if (clampLeft < 340) {
          this.widget.classList.add('dock-left');
        } else {
          this.widget.classList.remove('dock-left');
        }

        if (clampTop < 200) {
          this.widget.classList.add('dock-top');
        } else {
          this.widget.classList.remove('dock-top');
        }
      }
    };

    const onPointerUp = () => {
      this.isMouseDown = false;

      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      window.removeEventListener('touchcancel', onPointerUp);

      if (this.isDragging) {
        this.isDragging = false;
        this.widget.classList.remove('is-dragging');
        document.body.classList.remove('is-dragging-mascot');

        // Play gentle audio settle chime
        if (window.soundEngine && typeof window.soundEngine.playTone === 'function') {
          window.soundEngine.playTone(840, 0.05);
        }

        // Celebrate landing at new coordinates with a quick happy hop
        this.jumpAndSpin();

        // Suppress follow-up click event
        this.suppressClick = true;
        setTimeout(() => {
          this.suppressClick = false;
        }, 120);
      }
    };

    if (this.container) {
      this.container.addEventListener('mousedown', onPointerDown);
      this.container.addEventListener('touchstart', onPointerDown, { passive: true });
    }
    if (this.holoBox) {
      this.holoBox.addEventListener('mousedown', onPointerDown);
      this.holoBox.addEventListener('touchstart', onPointerDown, { passive: true });
    }

    // Window resize handler to keep positioned widget in viewport
    window.addEventListener('resize', () => {
      if (this.widget && this.widget.style.left && this.widget.style.left !== 'auto') {
        const widgetRect = this.widget.getBoundingClientRect();
        const maxLeft = Math.max(0, window.innerWidth - widgetRect.width);
        const maxTop = Math.max(0, window.innerHeight - widgetRect.height);
        const curLeft = parseFloat(this.widget.style.left) || 0;
        const curTop = parseFloat(this.widget.style.top) || 0;

        const clampLeft = Math.max(0, Math.min(maxLeft, curLeft));
        const clampTop = Math.max(0, Math.min(maxTop, curTop));

        this.widget.style.left = `${clampLeft}px`;
        this.widget.style.top = `${clampTop}px`;
      }
    });
  }

  jumpAndSpin() {
    if (this.isSpinning) return;
    this.isSpinning = true;
    this.spinStartTime = performance.now();

    if (window.soundEngine && typeof window.soundEngine.playDroidHappy === 'function') {
      window.soundEngine.playDroidHappy();
    }
  }

  scheduleNextBlink() {
    // Random blink every 3 to 6 seconds
    const interval = 3000 + Math.random() * 3000;
    this.blinkNextTime = performance.now() + interval;
  }

  setTalking(talking = true) {
    this.isTalking = Boolean(talking);
  }

  onReducedMotionChange(e) {
    this.reducedMotion = e.matches;
  }

  animate() {
    this.animFrameId = requestAnimationFrame(() => this.animate());

    if (!this.renderer || !this.scene || !this.camera) return;

    const time = this.clock.getElapsedTime();
    const now = performance.now();

    if (this.reducedMotion) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    // ==========================================
    // 1. Idle Bobbing & Swaying (Smooth Sine Wave)
    // ==========================================
    let basePosY = Math.sin(time * 2.2) * 0.08;
    let baseRotZ = Math.sin(time * 1.4) * 0.035;

    // ==========================================
    // 2. Jump and Spin Interaction
    // ==========================================
    if (this.isSpinning) {
      const elapsed = now - this.spinStartTime;
      const progress = Math.min(1.0, elapsed / this.spinDuration);
      
      // Jump curve
      const jumpY = Math.sin(progress * Math.PI) * 0.38;
      basePosY += jumpY;

      // 360-degree spin
      this.droidGroup.rotation.y = progress * Math.PI * 2;

      if (progress >= 1.0) {
        this.isSpinning = false;
        this.droidGroup.rotation.y = 0;
      }
    } else {
      this.droidGroup.rotation.y = 0;
    }

    this.droidGroup.position.y = basePosY;
    this.droidGroup.rotation.z = baseRotZ;

    // ==========================================
    // 3. Head Mouse Pointer Tracking
    // ==========================================
    if (this.headGroup) {
      this.headGroup.rotation.y = THREE.MathUtils.lerp(this.headGroup.rotation.y, this.targetHeadYaw, 0.08);
      this.headGroup.rotation.x = THREE.MathUtils.lerp(this.headGroup.rotation.x, this.targetHeadPitch, 0.08);
    }

    // ==========================================
    // 4. Blinking Logic (~0.1s duration)
    // ==========================================
    if (now >= this.blinkNextTime && !this.isBlinking) {
      this.isBlinking = true;
      this.blinkStartTime = now;
    }

    if (this.isBlinking) {
      const blinkElapsed = now - this.blinkStartTime;
      if (blinkElapsed < 110) {
        // Squash eye vertically
        if (this.eyeMesh) this.eyeMesh.scale.y = 0.08;
        if (this.eyeHighlight) this.eyeHighlight.visible = false;
      } else {
        if (this.eyeMesh) this.eyeMesh.scale.y = 1.0;
        if (this.eyeHighlight) this.eyeHighlight.visible = true;
        this.isBlinking = false;
        this.scheduleNextBlink();
      }
    }

    // ==========================================
    // 5. Thruster Flicker (Random Scaling)
    // ==========================================
    if (this.thrusterCone) {
      const flickerScale = 0.85 + Math.random() * 0.35;
      this.thrusterCone.scale.set(
        0.95 + (Math.random() - 0.5) * 0.1,
        flickerScale,
        0.95 + (Math.random() - 0.5) * 0.1
      );
    }

    // ==========================================
    // 6. Antenna Tip Pulse
    // ==========================================
    if (this.antennaTipMat) {
      const pulse = 0.85 + Math.sin(time * 3.5) * 0.35;
      this.antennaTipMat.emissiveIntensity = pulse;
    }

    // ==========================================
    // 7. Blinking Orbiting Stars (replaces DNA helix)
    // ==========================================
    if (this.stars && this.stars.length > 0) {
      const speedMultiplier = this.isTalking ? 2.5 : 1.0;
      for (let i = 0; i < this.stars.length; i++) {
        const star = this.stars[i];
        
        // Orbital trajectory
        star.angle += 0.016 * star.speed * speedMultiplier;
        const x = Math.cos(star.angle) * star.radius;
        const z = Math.sin(star.angle) * star.radius;
        const y = star.baseY + Math.sin(time * 2.2 + star.twinklePhase) * 0.06 + x * star.tiltX + z * star.tiltZ;
        
        star.mesh.position.set(x, y, z);
        star.mesh.rotation.y += star.selfSpinSpeed * speedMultiplier;
        star.mesh.rotation.z += star.selfSpinSpeed * 0.7;

        // Blinking / Twinkling light & scale
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase);
        const flare = Math.max(0, twinkle);
        const currentScale = star.baseScale * (0.65 + 0.75 * flare) * (this.isTalking ? 1.25 : 1.0);
        star.mesh.scale.setScalar(currentScale);

        if (star.material) {
          const intensity = 0.5 + 2.0 * Math.pow((twinkle + 1) / 2, 2.2) * (this.isTalking ? 1.5 : 1.0);
          star.material.emissiveIntensity = intensity;
        }
      }
    }

    if (this.eyeMaterial) {
      if (this.isTalking) {
        // Eye pulses with higher intensity while talking
        const talkPulse = 1.2 + Math.sin(time * 12) * 0.7;
        this.eyeMaterial.emissiveIntensity = talkPulse;
      } else {
        this.eyeMaterial.emissiveIntensity = 1.15;
      }
    }

    // ==========================================
    // 8. Cursor Companion Floating Follow
    // ==========================================
    if (this.isFollowingCursor && this.widget && !this.isDragging) {
      const targetX = this.lastCursorX + 18;
      const targetY = this.lastCursorY - 95;
      
      this.followX = THREE.MathUtils.lerp(this.followX, targetX, 0.12);
      this.followY = THREE.MathUtils.lerp(this.followY, targetY, 0.12);
      
      const maxX = Math.max(0, window.innerWidth - 165);
      const maxY = Math.max(0, window.innerHeight - 195);
      const clampedX = Math.max(10, Math.min(maxX, this.followX));
      const clampedY = Math.max(10, Math.min(maxY, this.followY));
      
      this.widget.style.left = `${clampedX.toFixed(1)}px`;
      this.widget.style.top = `${clampedY.toFixed(1)}px`;
      this.widget.style.right = 'auto';
      this.widget.style.bottom = 'auto';
    }

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }

    window.removeEventListener('mousemove', this.onMouseMove);
    if (this.canvas) {
      this.canvas.removeEventListener('click', this.onCanvasClick);
      this.canvas.removeEventListener('dblclick', this.onCanvasDblClick);
    }
    if (this.container) {
      this.container.removeEventListener('dblclick', this.onCanvasDblClick);
    }

    // Dispose Geometries
    this.geometries.forEach(geo => geo.dispose());
    this.geometries = [];

    // Dispose Materials
    this.materials.forEach(mat => mat.dispose());
    this.materials = [];

    // Dispose Renderer
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer = null;
    }
  }
}

// Global exposure
window.Helix7Mascot = Helix7Mascot;
