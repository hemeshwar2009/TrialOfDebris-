/**
 * NASA SPACE LEGACY - Hardware Diagram & Blueprint Renderer
 * Renders interactive retro vector blueprints for all 24 unique NASA spacecraft.
 * Players click components to inspect damaged parts and unlock forensic clues.
 */

class HardwareBlueprintRenderer {
  constructor(canvasId, onComponentSelect) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.onComponentSelect = onComponentSelect;
    this.currentCase = null;
    this.activeComponentId = null;
    this.hoverComponentId = null;

    this.initEvents();
  }

  loadCase(caseData) {
    this.currentCase = caseData;
    this.activeComponentId = caseData.interactiveComponents[0]?.id || null;
    this.render();
  }

  initEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      const hit = this.checkHit(mouseX, mouseY);
      if (hit !== this.hoverComponentId) {
        this.hoverComponentId = hit;
        this.canvas.style.cursor = hit ? 'pointer' : 'default';
        if (hit) window.soundEngine.playTone(950, 0.02, 'sine', 0.04);
        this.render();
      }
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      const hit = this.checkHit(mouseX, mouseY);
      if (hit) {
        this.activeComponentId = hit;
        window.soundEngine.playSelect();
        if (this.onComponentSelect) {
          const comp = this.currentCase.interactiveComponents.find(c => c.id === hit);
          this.onComponentSelect(comp);
        }
        this.render();
      }
    });
  }

  checkHit(x, y) {
    if (!this.currentCase) return null;
    const comps = this.getComponentHitboxes();
    for (const c of comps) {
      const dist = Math.hypot(x - c.x, y - c.y);
      if (dist <= c.radius) {
        return c.id;
      }
    }
    return null;
  }

  getComponentHitboxes() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const comps = this.currentCase?.interactiveComponents || [];
    const count = comps.length;
    if (count === 0) return [];

    // Dedicated clean positioning for each component in any of the 24 missions
    const hitboxes = [];
    if (count === 1) {
      hitboxes.push({ id: comps[0].id, x: w * 0.5, y: h * 0.52, radius: 42 });
    } else if (count === 2) {
      hitboxes.push({ id: comps[0].id, x: w * 0.35, y: h * 0.52, radius: 40 });
      hitboxes.push({ id: comps[1].id, x: w * 0.65, y: h * 0.52, radius: 40 });
    } else if (count === 3) {
      hitboxes.push({ id: comps[0].id, x: w * 0.28, y: h * 0.44, radius: 38 });
      hitboxes.push({ id: comps[1].id, x: w * 0.72, y: h * 0.44, radius: 38 });
      hitboxes.push({ id: comps[2].id, x: w * 0.5, y: h * 0.72, radius: 38 });
    } else {
      const angles = [-Math.PI * 0.75, -Math.PI * 0.25, Math.PI * 0.25, Math.PI * 0.75];
      comps.forEach((c, idx) => {
        const ang = angles[idx % angles.length];
        const x = w * 0.5 + Math.cos(ang) * (w * 0.28);
        const y = h * 0.52 + Math.sin(ang) * (h * 0.26);
        hitboxes.push({ id: c.id, x, y, radius: 36 });
      });
    }

    return hitboxes;
  }

  render() {
    if (!this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Dark retro blueprint background
    ctx.fillStyle = '#0d071e';
    ctx.fillRect(0, 0, w, h);

    // Glowing grid lines (Purple retro phosphor)
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (!this.currentCase) return;

    // Draw vector schematic
    this.drawSchematicArt(ctx, w, h);

    // Draw interactive component markers & rings
    const hitboxes = this.getComponentHitboxes();
    hitboxes.forEach(hb => {
      const comp = this.currentCase.interactiveComponents.find(c => c.id === hb.id);
      if (!comp) return;

      const isActive = this.activeComponentId === hb.id;
      const isHover = this.hoverComponentId === hb.id;

      // Status indicator color (cyan = confirmed, amber = suspected)
      const color = comp.statusType === 'confirmed' ? '#38bdf8' : '#fbbf24';

      // Pulse ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(hb.x, hb.y, hb.radius * (isActive ? 1.25 : 1.05), 0, Math.PI * 2);
      ctx.strokeStyle = isActive ? '#ec4899' : (isHover ? '#ffffff' : color);
      ctx.lineWidth = isActive ? 3 : 2;
      ctx.setLineDash(isActive ? [] : [4, 4]);
      ctx.stroke();
      ctx.restore();

      // Core dot
      ctx.fillStyle = isActive ? '#ec4899' : color;
      ctx.beginPath();
      ctx.arc(hb.x, hb.y, 7, 0, Math.PI * 2);
      ctx.fill();

      // Label flag
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillStyle = isActive ? '#f43f5e' : (isHover ? '#ffffff' : '#c084fc');
      ctx.textAlign = 'center';
      ctx.fillText(comp.name.substring(0, 16), hb.x, hb.y - hb.radius - 8);

      // Status pill badge
      ctx.font = '9px "Share Tech Mono", monospace';
      ctx.fillStyle = color;
      ctx.fillText(`[${comp.statusType.toUpperCase()}]`, hb.x, hb.y + hb.radius + 14);
    });

    // Retro framing corners
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    // Top-left
    ctx.strokeRect(10, 10, 15, 2);
    ctx.strokeRect(10, 10, 2, 15);
    // Top-right
    ctx.strokeRect(w - 25, 10, 15, 2);
    ctx.strokeRect(w - 12, 10, 2, 15);
    // Bottom-left
    ctx.strokeRect(10, h - 12, 15, 2);
    ctx.strokeRect(10, h - 25, 2, 15);
    // Bottom-right
    ctx.strokeRect(w - 25, h - 12, 15, 2);
    ctx.strokeRect(w - 12, h - 25, 2, 15);
  }

  drawSchematicArt(ctx, w, h) {
    const type = this.currentCase.hardwareDiagram || 'probe';
    ctx.save();
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.45)';
    ctx.fillStyle = 'rgba(76, 29, 149, 0.2)';
    ctx.lineWidth = 2;

    if (type.includes('rover')) {
      // Rover Chassis
      ctx.strokeRect(w * 0.35, h * 0.45, w * 0.3, h * 0.25);
      ctx.fillRect(w * 0.35, h * 0.45, w * 0.3, h * 0.25);

      // Solar Array Wings
      ctx.strokeRect(w * 0.2, h * 0.38, w * 0.6, h * 0.08);

      // High Gain Antenna Mast
      ctx.beginPath();
      ctx.moveTo(w * 0.68, h * 0.45);
      ctx.lineTo(w * 0.72, h * 0.28);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w * 0.72, h * 0.28, 16, Math.PI, 0);
      ctx.stroke();

      // Rocker-Bogie Suspension & 6 Wheels
      const wheels = [0.28, 0.5, 0.72];
      wheels.forEach(wx => {
        ctx.beginPath();
        ctx.arc(w * wx, h * 0.76, 14, 0, Math.PI * 2);
        ctx.stroke();
      });
    } else if (type.includes('orbiter') || type.includes('mariner')) {
      // Main central bus
      ctx.strokeRect(w * 0.4, h * 0.35, w * 0.2, h * 0.35);
      ctx.fillRect(w * 0.4, h * 0.35, w * 0.2, h * 0.35);

      // Solar arrays
      ctx.strokeRect(w * 0.15, h * 0.42, w * 0.25, h * 0.2);
      ctx.strokeRect(w * 0.6, h * 0.42, w * 0.25, h * 0.2);

      // High gain dish
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.28, 22, 0, Math.PI * 2);
      ctx.stroke();

      // Rocket engine nozzle
      ctx.beginPath();
      ctx.moveTo(w * 0.46, h * 0.7);
      ctx.lineTo(w * 0.42, h * 0.85);
      ctx.lineTo(w * 0.58, h * 0.85);
      ctx.lineTo(w * 0.54, h * 0.7);
      ctx.closePath();
      ctx.stroke();
    } else if (type === 'apollo_sm' || type === 'apollo_saturn') {
      // Service Module Cylinder
      ctx.strokeRect(w * 0.35, h * 0.3, w * 0.35, h * 0.45);
      ctx.fillRect(w * 0.35, h * 0.3, w * 0.35, h * 0.45);

      // Bay 4 Rupture Zone
      ctx.strokeStyle = '#ef4444';
      ctx.strokeRect(w * 0.38, h * 0.38, w * 0.14, h * 0.22);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.fillRect(w * 0.38, h * 0.38, w * 0.14, h * 0.22);

      // SPS Engine Bell
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.45)';
      ctx.beginPath();
      ctx.moveTo(w * 0.7, h * 0.4);
      ctx.lineTo(w * 0.88, h * 0.32);
      ctx.lineTo(w * 0.88, h * 0.68);
      ctx.lineTo(w * 0.7, h * 0.6);
      ctx.closePath();
      ctx.stroke();

      // Command / Lunar Module
      ctx.strokeRect(w * 0.15, h * 0.32, w * 0.18, h * 0.38);
    } else if (type.includes('lander')) {
      // Lander hexagonal bus
      ctx.beginPath();
      ctx.moveTo(w * 0.35, h * 0.62);
      ctx.lineTo(w * 0.42, h * 0.38);
      ctx.lineTo(w * 0.58, h * 0.38);
      ctx.lineTo(w * 0.65, h * 0.62);
      ctx.closePath();
      ctx.stroke();
      ctx.fillRect(w * 0.35, h * 0.62, w * 0.3, h * 0.08);

      // 3 or 4 Landing Struts
      ctx.beginPath();
      ctx.moveTo(w * 0.35, h * 0.62);
      ctx.lineTo(w * 0.22, h * 0.78);
      ctx.moveTo(w * 0.65, h * 0.62);
      ctx.lineTo(w * 0.78, h * 0.78);
      ctx.moveTo(w * 0.5, h * 0.65);
      ctx.lineTo(w * 0.5, h * 0.82);
      ctx.stroke();

      // Footpads
      ctx.strokeRect(w * 0.18, h * 0.78, 20, 4);
      ctx.strokeRect(w * 0.74, h * 0.78, 20, 4);
      ctx.strokeRect(w * 0.46, h * 0.82, 20, 4);
    } else {
      // General Deep Space Probe silhouette
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, 36, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillRect(w * 0.4, h * 0.4, w * 0.2, h * 0.2);

      // Solar sails / booms
      ctx.beginPath();
      ctx.moveTo(w * 0.2, h * 0.5);
      ctx.lineTo(w * 0.8, h * 0.5);
      ctx.moveTo(w * 0.5, h * 0.2);
      ctx.lineTo(w * 0.5, h * 0.8);
      ctx.stroke();
    }

    ctx.restore();
  }
}
