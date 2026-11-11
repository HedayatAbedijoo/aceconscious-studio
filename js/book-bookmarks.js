/* Paper Breeze: the reference prototype's curved, textured paper strips.
 * The existing buttons own layout, scrolling, focus and navigation. Canvas is
 * only their visual surface; a missing canvas keeps the CSS tabs.
 */
"use strict";
window.createBookmarkPaper = function ({ nav, stage, reducedMotion }) {
  // Cuts and lifted lips from Paper Breeze. Moderate the variation and slant,
  // retaining its paper proportions without the reference's scattered stack.
  const cuts = [
    { w: 1.08, h: 1.02, tilt: -2.9, lift: 2.8, bend: 29, dy: -1, twist: .8 },
    { w: .97, h: .91, tilt: 2.1, lift: .7, bend: 33, dy: 0, twist: -.7 },
    { w: 1.02, h: .98, tilt: -1.3, lift: 2.1, bend: 27, dy: -1, twist: 1 },
    { w: .95, h: 1.04, tilt: 3.2, lift: 1, bend: 32, dy: 1, twist: -1 },
    { w: 1.04, h: .93, tilt: -2.1, lift: 3, bend: 31, dy: 0, twist: .5 },
    { w: .94, h: .96, tilt: 1.8, lift: .6, bend: 26, dy: -1, twist: -.7 },
    { w: 1.06, h: .94, tilt: -3.1, lift: 2.3, bend: 34, dy: 1, twist: .8 },
    { w: 1, h: 1.01, tilt: 1.2, lift: .8, bend: 28, dy: 0, twist: -.5 },
    { w: .96, h: .96, tilt: -1.7, lift: 2.6, bend: 32, dy: 0, twist: .8 },
    { w: 1.03, h: .91, tilt: 2.5, lift: 1.2, bend: 30, dy: 1, twist: -.6 }
  ];
  const sheets = [...nav.querySelectorAll(".bookmark")].map((button, index) => {
    const canvas = document.createElement("canvas");
    canvas.className = "bookmark-canvas";
    canvas.setAttribute("aria-hidden", "true");
    return { button, canvas, ctx: canvas.getContext("2d"), index,
      p: 1, from: 1, target: 1, start: 0, duration: 1, hover: 0, goal: 0 };
  });
  if (sheets.some(sheet => !sheet.ctx)) return null;
  sheets.forEach(sheet => sheet.button.append(sheet.canvas));
  nav.classList.add("paper-breeze");

  let opened = true, enabled = false, inView = true, dirty = true;
  let frame = 0, lastPaint = 0, sceneTime = 0;
  const clamp = value => Math.max(0, Math.min(1, value));

  // The prototype's uncoated pigment and fibres, cached instead of regenerated
  // during motion. Labels are drawn onto the front and follow the same curve.
  function texture(sheet, back) {
    const { length: w, height: h, index, style } = sheet;
    const scale = 3, canvas = document.createElement("canvas");
    canvas.width = Math.ceil(w * scale); canvas.height = Math.ceil(h * scale);
    const ctx = canvas.getContext("2d");
    let seed = 1703 + index * 29;
    const random = () => { seed = seed * 16807 % 2147483647; return seed / 2147483647; };
    const rgb = sheet.color.slice(1).match(/../g).map(value => parseInt(value, 16));
    const pixels = ctx.createImageData(canvas.width, canvas.height);
    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
      const k = (y * canvas.width + x) * 4;
      const grain = (random() - .5) * 8 + Math.sin(x * .035 + y * .022 + index) * 1.4 + Math.sin(y * .19 - x * .013) * .8;
      for (let n = 0; n < 3; n++) pixels.data[k + n] = rgb[n] + grain + (back ? 5 : 0);
      pixels.data[k + 3] = 255;
    }
    ctx.putImageData(pixels, 0, 0); ctx.scale(scale, scale);
    for (let n = 0; n < 380; n++) {
      const x = random() * w, y = random() * h;
      ctx.strokeStyle = n % 3 ? "rgba(66,49,29,.045)" : "rgba(255,248,226,.16)";
      ctx.lineWidth = .22 + random() * .2;
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.lineTo(x + .5 + random() * 2.5, y + (random() - .5) * .8); ctx.stroke();
    }
    if (!back) {
      ctx.save();
      // Geometry reverses at the opposite fore edge; keep every script upright.
      if (sheet.direction < 0) { ctx.translate(w, 0); ctx.scale(-1, 1); }
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      ctx.direction = style.direction;
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#4e4a3e";
      const text = sheet.button.textContent.trim(), maxWidth = w - 18;
      const words = typeof Intl.Segmenter === "function"
        ? [...new Intl.Segmenter(document.documentElement.lang, { granularity: "word" }).segment(text)].map(part => part.segment)
        : text.split(/(\s+)/);
      const lines = [];
      let line = "";
      for (const word of words) {
        if (line.trim() && ctx.measureText(line + word).width > maxWidth) {
          lines.push(line.trim()); line = word.trimStart();
        } else line += word;
      }
      if (line.trim()) lines.push(line.trim());
      const leading = parseFloat(style.fontSize) * 1.35;
      lines.forEach((label, i) => ctx.fillText(label, w / 2, h / 2 + .5 + (i - (lines.length - 1) / 2) * leading, maxWidth));
      ctx.restore();
      if (sheet.active) {
        ctx.fillStyle = "#966648"; ctx.beginPath(); ctx.arc(6, h / 2, 1.4, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Soft cut corners and tiny imperfections in the uncoated edge.
    ctx.globalCompositeOperation = "destination-in"; ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.moveTo(0, 5 + index % 3);
    ctx.quadraticCurveTo(.4, .6, 5, .65);
    ctx.lineTo(w * .31, .3); ctx.lineTo(w * .68, .8); ctx.lineTo(w, .2);
    ctx.lineTo(w, h - .5); ctx.lineTo(w * .55, h - .9); ctx.lineTo(5, h - .3);
    ctx.quadraticCurveTo(.3, h - .3, .4, h - 4); ctx.closePath(); ctx.fill();
    return canvas;
  }

  function measure() {
    dirty = false;
    const desktop = document.documentElement.classList.contains("desktop-book");
    enabled = (desktop || document.documentElement.classList.contains("immersive-reading")) && !stage.classList.contains("is-closed");
    if (!enabled) return;
    const direction = (Number(getComputedStyle(nav).getPropertyValue("--tab-direction")) || 1) * (desktop ? -1 : 1);
    for (const sheet of sheets) {
      const style = getComputedStyle(sheet.button);
      const active = sheet.button.getAttribute("aria-current") === "true";
      const width = sheet.button.clientWidth, height = sheet.button.clientHeight;
      // Supersample the gently slanted desktop text even on a 1× display.
      const ratio = Math.min(Math.max(devicePixelRatio || 1, desktop ? 2 : 1), 2.5);
      const color = style.getPropertyValue("--tab").trim();
      const cut = cuts[sheet.index % cuts.length];
      const slant = cut.tilt * .55 * Math.PI / 180;
      const length = width * (active ? 1.02 : .94) * (1 + (cut.w - 1) * .55);
      const stockScale = length / 111;
      const signature = [width, height, ratio, direction, active, color, style.font, slant, sheet.button.textContent].join("|");
      if (signature === sheet.signature) continue;
      Object.assign(sheet, { signature, style, active, direction, color, ratio, slant,
        length, height: height * (active ? 1.02 : .94) * (1 + (cut.h - 1) * .55),
        lift: (cut.lift + 5.2) * stockScale, twist: cut.twist * .55, bend: cut.bend * stockScale,
        width: width + 20, canvasHeight: height + 24, y: height / 2 + 12 + cut.dy * .4 });
      sheet.canvas.width = Math.round(sheet.width * ratio);
      sheet.canvas.height = Math.round(sheet.canvasHeight * ratio);
      sheet.front = texture(sheet, false); sheet.back = texture(sheet, true);
    }
  }

  function air(index) {
    if (reducedMotion.matches) return { lift: 0, twist: 0, fold: 0 };
    const t = sceneTime, phase = index * 2.399963;
    return {
      lift: .85 * Math.sin(t * .92 + phase) + .28 * Math.sin(t * 1.71 + phase * 1.7),
      twist: (.35 * Math.sin(t * 1.13 + phase + .9) + .12 * Math.sin(t * 2.03 + phase * 1.3)) * .55,
      fold: .72 * Math.sin(t * 1.04 + phase + .4) + .22 * Math.sin(t * .61 + phase * 2)
    };
  }

  function drawSheet(sheet) {
    const { ctx, ratio, direction, p } = sheet;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, sheet.width, sheet.canvasHeight);
    const root = direction > 0 ? sheet.width - 1 : 1;
    const breeze = air(sheet.index), count = 64;
    const slant = sheet.slant * p;
    const length = sheet.length * (1 + sheet.hover * .065), height = sheet.height * (1 + sheet.hover * .045);
    const ds = length / count, angle = (1 - p) * Math.PI * .91;
    // A tight closed hinge leaves only a few millimetres visible. During the
    // release its radius grows into the prototype's single broad paper arc.
    const closedBend = sheet.active ? 14 : 10;
    const bendSpan = closedBend + Math.sin(Math.PI * p) * (sheet.bend - closedBend + length * .36) + breeze.fold * (1 - p) * .35;
    const tangent = s => { const u = Math.min(1, s / bendSpan); return angle * u * u * (3 - 2 * u); };
    const points = [];
    let x = 0, z = 0;
    function project(s, x, z) {
      const u = s / length, free = u * u * (3 - 2 * u);
      const depth = z + (sheet.lift + breeze.lift + sheet.hover * 3) * free * p;
      function edge(v) {
        const twist = sheet.twist * Math.sin(Math.PI * p) * u
          + (sheet.twist * .7 + breeze.twist) * free * (.35 + .65 * p);
        const zz = depth + v * twist * .1;
        const zoom = 650 / (650 - zz);
        return { x: root + direction * ((x * Math.cos(slant) - v * Math.sin(slant)) * zoom + zz * .09),
          y: sheet.y + (x * Math.sin(slant) + v * Math.cos(slant)) * zoom - zz * .18 + breeze.lift * .8 * free * p };
      }
      return { top: edge(-height / 2), bottom: edge(height / 2), z: depth, normal: Math.cos(tangent(s)) };
    }
    points.push(project(0, 0, 0));
    for (let j = 1; j <= count; j++) {
      const a = tangent((j - .5) * ds);
      x -= Math.cos(a) * ds; z += Math.sin(a) * ds;
      points.push(project(j * ds, x, z));
    }
    ctx.save(); ctx.beginPath();
    const shadow = (point, edge) => ({ x: point[edge].x - direction * Math.min(point.z, 30) * .09,
      y: point[edge].y + 1 + Math.min(point.z, 30) * .28 });
    points.forEach((point, i) => { const q = shadow(point, "top"); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); });
    [...points].reverse().forEach(point => { const q = shadow(point, "bottom"); ctx.lineTo(q.x, q.y); });
    ctx.closePath(); ctx.shadowColor = "rgba(57,47,30,.19)";
    // Canvas shadows use device pixels rather than the current transform.
    ctx.shadowBlur = (3.5 + p * (sheet.length / 111 + breeze.lift * .22) + Math.sin(Math.PI * p) * 6) * ratio;
    ctx.shadowOffsetX = -.5 * direction * ratio; ctx.shadowOffsetY = .8 * ratio;
    ctx.fillStyle = "rgba(57,47,30,.08)"; ctx.fill(); ctx.restore();
    // Opaque stock under the narrow texture patches prevents hairline seams.
    ctx.beginPath();
    points.forEach((point, i) => i ? ctx.lineTo(point.top.x, point.top.y) : ctx.moveTo(point.top.x, point.top.y));
    [...points].reverse().forEach(point => ctx.lineTo(point.bottom.x, point.bottom.y));
    ctx.closePath(); ctx.fillStyle = sheet.color; ctx.fill();
    const parts = Array.from({ length: count }, (_, j) => ({ j, depth: (points[j].z + points[j + 1].z) / 2 }));
    parts.sort((a, b) => a.depth - b.depth);
    for (const { j } of parts) {
      const near = points[j], far = points[j + 1], normal = (near.normal + far.normal) / 2;
      const tex = normal >= 0 ? sheet.front : sheet.back;
      const a = far.top, b = { ...near.top }, c = { ...near.bottom }, d = far.bottom;
      const dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy);
      if (distance < .02) continue;
      b.x += dx / distance * .18; b.y += dy / distance * .18;
      c.x += dx / distance * .18; c.y += dy / distance * .18;
      const sw = tex.width / count, sx = tex.width - (j + 1) * sw, th = tex.height;
      const patch = () => { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath(); };
      ctx.save(); patch(); ctx.clip();
      ctx.transform((b.x - a.x) / sw, (b.y - a.y) / sw, (d.x - a.x) / th, (d.y - a.y) / th, a.x, a.y);
      ctx.drawImage(tex, Math.max(0, sx), 0, sw, th, 0, 0, sw, th); ctx.restore();
      const shade = .095 * (1 - Math.abs(normal));
      if (shade > .003 && j < count - 4) { patch(); ctx.fillStyle = `rgba(64,51,34,${shade})`; ctx.fill(); }
    }
  }

  function wake() {
    if (!frame && !document.hidden && inView) frame = requestAnimationFrame(animate);
  }
  function suspend() { cancelAnimationFrame(frame); frame = 0; }
  function refresh() { dirty = true; wake(); }
  function animate(now) {
    frame = 0;
    if (document.hidden || !inView) return;
    const measureNeeded = dirty;
    if (dirty) measure();
    if (!enabled) return;
    let moving = false;
    for (const sheet of sheets) {
      const t = reducedMotion.matches ? 1 : clamp((now - sheet.start) / sheet.duration);
      sheet.p = sheet.from + (sheet.target - sheet.from) * (1 - Math.pow(1 - t, 3.3));
      if (t < 1) moving = true;
      const delta = sheet.goal - sheet.hover;
      sheet.hover += Math.abs(delta) < .001 || reducedMotion.matches ? delta : delta * .22;
      if (Math.abs(delta) >= .001) moving = true;
    }
    if (moving || measureNeeded || reducedMotion.matches || now - lastPaint >= 1000 / 30) {
      sceneTime = now / 1000; sheets.forEach(drawSheet); lastPaint = now;
    }
    // No permanent loop while reading, on the cover, off-screen or in a
    // background tab. Reduced motion gets a single, fully settled painting.
    if (moving || (opened && !reducedMotion.matches)) wake();
  }
  function setOpen(next) {
    if (next === opened) return;
    opened = next;
    const now = performance.now();
    sheets.forEach((sheet, i) => {
      sheet.from = sheet.p; sheet.target = next ? 1 : 0;
      sheet.start = now + (reducedMotion.matches ? 0 : (next ? i : sheets.length - 1 - i) * 12);
      sheet.duration = reducedMotion.matches ? 1 : (next ? 520 : 440) * Math.max(.45, Math.abs(sheet.target - sheet.p));
    });
    wake();
  }
  function proximity() {
    sheets.forEach(sheet => { sheet.goal = reducedMotion.matches ? 0 : Math.sqrt(Number(sheet.button.style.getPropertyValue("--tab-grow")) / .065) || 0; });
    wake();
  }

  const observer = new ResizeObserver(refresh);
  observer.observe(nav); sheets.forEach(sheet => observer.observe(sheet.button));
  new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    if (inView) refresh(); else suspend();
  }).observe(stage);
  document.addEventListener("visibilitychange", () => { if (document.hidden) suspend(); else refresh(); });
  reducedMotion.addEventListener("change", () => { proximity(); refresh(); });
  document.fonts.addEventListener("loadingdone", () => { sheets.forEach(sheet => { sheet.signature = ""; }); refresh(); });
  refresh();
  return { setOpen, refresh, proximity };
};
