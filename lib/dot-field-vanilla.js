const TWO_PI = Math.PI * 2;

export function initDotField(container, userOptions = {}) {
  if (!container) return null;

  let opts = {
    dotRadius: 1.5,
    dotSpacing: 14,
    cursorRadius: 350,
    cursorForce: 0.1,
    bulgeOnly: true,
    bulgeStrength: 50,
    glowRadius: 150,
    sparkle: false,
    waveAmplitude: 0,
    gradientFrom: 'rgba(56, 189, 248, 0.45)',
    gradientTo: 'rgba(96, 165, 250, 0.25)',
    glowColor: 'rgba(56, 189, 248, 0.25)',
    ...userOptions
  };

  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  container.appendChild(canvas);

  const glowId = `dot-field-glow-${Math.random().toString(36).slice(2, 9)}`;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.position = 'absolute';
  svg.style.inset = '0';
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.pointerEvents = 'none';

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const radGrad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
  radGrad.setAttribute('id', glowId);

  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', opts.glowColor);

  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stop-color', 'transparent');

  radGrad.appendChild(stop1);
  radGrad.appendChild(stop2);
  defs.appendChild(radGrad);
  svg.appendChild(defs);

  const glowCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  glowCircle.setAttribute('cx', '-9999');
  glowCircle.setAttribute('cy', '-9999');
  glowCircle.setAttribute('r', String(opts.glowRadius));
  glowCircle.setAttribute('fill', `url(#${glowId})`);
  glowCircle.style.opacity = '0';
  glowCircle.style.willChange = 'opacity';
  svg.appendChild(glowCircle);
  container.appendChild(svg);

  const ctx = canvas.getContext('2d', { alpha: true });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let dots = [];
  const mouse = { x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 };
  const size = { w: 0, h: 0, offsetX: 0, offsetY: 0 };
  let glowOpacity = 0;
  let engagement = 0;
  let rafId = null;
  let resizeTimer = null;
  let isVisible = true;
  let observer = null;

  function doResize() {
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (w === 0 || h === 0) return;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    size.w = w;
    size.h = h;
    size.offsetX = rect.left + window.scrollX;
    size.offsetY = rect.top + window.scrollY;

    buildDots(w, h);
  }

  function resize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(doResize, 100);
  }

  function buildDots(w, h) {
    const step = opts.dotRadius + opts.dotSpacing;
    const cols = Math.floor(w / step);
    const rows = Math.floor(h / step);
    const padX = (w % step) / 2;
    const padY = (h % step) / 2;
    dots = new Array(rows * cols);
    let idx = 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const ax = padX + col * step + step / 2;
        const ay = padY + row * step + step / 2;
        dots[idx++] = { ax, ay, sx: ax, sy: ay, vx: 0, vy: 0, x: ax, y: ay };
      }
    }
  }

  function onMouseMove(e) {
    const rect = container.getBoundingClientRect();
    size.offsetX = rect.left + window.scrollX;
    size.offsetY = rect.top + window.scrollY;
    mouse.x = e.pageX - size.offsetX;
    mouse.y = e.pageY - size.offsetY;
  }

  function updateMouseSpeed() {
    const dx = mouse.prevX - mouse.x;
    const dy = mouse.prevY - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    mouse.speed += (dist - mouse.speed) * 0.5;
    if (mouse.speed < 0.001) mouse.speed = 0;
    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;
  }

  const speedInterval = setInterval(updateMouseSpeed, 20);

  let frameCount = 0;

  function tick() {
    if (isVisible && size.w > 0 && size.h > 0) {
      frameCount++;
      const { w, h } = size;
      const len = dots.length;
      const t = frameCount * 0.02;

      const targetEngagement = Math.min(mouse.speed / 5, 1);
      engagement += (targetEngagement - engagement) * 0.06;
      if (engagement < 0.001) engagement = 0;
      const eng = engagement;

      glowOpacity += (eng - glowOpacity) * 0.08;

      if (glowCircle) {
        glowCircle.setAttribute('cx', String(mouse.x));
        glowCircle.setAttribute('cy', String(mouse.y));
        glowCircle.style.opacity = String(glowOpacity);
      }

      ctx.clearRect(0, 0, w, h);

      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, opts.gradientFrom);
      grad.addColorStop(1, opts.gradientTo);
      ctx.fillStyle = grad;

      const cr = opts.cursorRadius;
      const crSq = cr * cr;
      const rad = opts.dotRadius / 2;
      const isBulge = opts.bulgeOnly;

      ctx.beginPath();

      for (let i = 0; i < len; i++) {
        const d = dots[i];
        if (!d) continue;
        const dx = mouse.x - d.ax;
        const dy = mouse.y - d.ay;
        const distSq = dx * dx + dy * dy;

        if (distSq < crSq && eng > 0.01) {
          const dist = Math.sqrt(distSq);
          if (isBulge) {
            const tVal = 1 - dist / cr;
            const push = tVal * tVal * opts.bulgeStrength * eng;
            const angle = Math.atan2(dy, dx);
            d.sx += (d.ax - Math.cos(angle) * push - d.sx) * 0.15;
            d.sy += (d.ay - Math.sin(angle) * push - d.sy) * 0.15;
          } else {
            const angle = Math.atan2(dy, dx);
            const move = (500 / dist) * (mouse.speed * opts.cursorForce);
            d.vx += Math.cos(angle) * -move;
            d.vy += Math.sin(angle) * -move;
          }
        } else if (isBulge) {
          d.sx += (d.ax - d.sx) * 0.1;
          d.sy += (d.ay - d.sy) * 0.1;
        }

        if (!isBulge) {
          d.vx *= 0.9;
          d.vy *= 0.9;
          d.x = d.ax + d.vx;
          d.y = d.ay + d.vy;
          d.sx += (d.x - d.sx) * 0.1;
          d.sy += (d.y - d.sy) * 0.1;
        }

        let drawX = d.sx;
        let drawY = d.sy;
        if (opts.waveAmplitude > 0) {
          drawY += Math.sin(d.ax * 0.03 + t) * opts.waveAmplitude;
          drawX += Math.cos(d.ay * 0.03 + t * 0.7) * opts.waveAmplitude * 0.5;
        }

        if (opts.sparkle) {
          const hash = ((i * 2654435761) ^ (frameCount >> 3)) >>> 0;
          if ((hash % 100) < 3) {
            ctx.moveTo(drawX + rad * 1.8, drawY);
            ctx.arc(drawX, drawY, rad * 1.8, 0, TWO_PI);
          } else {
            ctx.moveTo(drawX + rad, drawY);
            ctx.arc(drawX, drawY, rad, 0, TWO_PI);
          }
        } else {
          ctx.moveTo(drawX + rad, drawY);
          ctx.arc(drawX, drawY, rad, 0, TWO_PI);
        }
      }

      ctx.fill();
    }

    rafId = requestAnimationFrame(tick);
  }

  function onTouchMove(e) {
    if (e.touches && e.touches[0]) {
      onMouseMove(e.touches[0]);
    }
  }

  doResize();
  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  rafId = requestAnimationFrame(tick);

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);
  }

  return {
    update(newOpts) {
      const oldRadius = opts.dotRadius;
      const oldSpacing = opts.dotSpacing;
      opts = { ...opts, ...newOpts };

      if (glowCircle) {
        glowCircle.setAttribute('r', String(opts.glowRadius));
      }
      if (stop1) {
        stop1.setAttribute('stop-color', opts.glowColor);
      }

      if (oldRadius !== opts.dotRadius || oldSpacing !== opts.dotSpacing) {
        if (size.w > 0 && size.h > 0) buildDots(size.w, size.h);
      }
    },
    destroy() {
      if (rafId) cancelAnimationFrame(rafId);
      clearInterval(speedInterval);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    }
  };
}

if (typeof window !== 'undefined') {
  window.initDotField = initDotField;
}
