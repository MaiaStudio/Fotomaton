// DriftWall Component — React Bits (Vanilla JavaScript Implementation)
export function createDriftWall(container, options = {}) {
  if (!container) return;

  const items = options.items || [];
  const columns = options.columns ?? 6;
  const tileWidth = options.tileWidth ?? 200;
  const tileHeight = options.tileHeight ?? 136;
  const gap = options.gap ?? 10;
  const radius = options.radius ?? 12;
  const tilt = options.tilt ?? 12;
  const turn = options.turn ?? -14;
  const roll = options.roll ?? 2;
  const perspective = options.perspective ?? 1500;
  const depth = options.depth ?? 120;
  const speed = options.speed ?? 42;
  const direction = options.direction ?? 'up';
  const variance = options.variance ?? 0.5;
  const parallax = options.parallax ?? 0.6;
  const fade = options.fade ?? 0.4;
  const dim = options.dim ?? 1;
  const overlayColor = options.overlayColor ?? '#000000';


  let rafId = null;
  let lastTs = null;

  // Build Column Items
  const columnItems = Array.from({ length: columns }, () => []);
  items.forEach((item, i) => columnItems[i % columns].push(item));
  const cols = columnItems.map(col => (col.length ? col : items.slice(0, 1)));

  // Calculate Meta per column
  const unit = tileHeight + gap;
  const containerHeight = container.offsetHeight || 600;

  const columnMeta = cols.map(col => {
    const copyHeight = Math.max(unit, col.length * unit);
    const copies = Math.max(2, Math.ceil((containerHeight * 1.6) / copyHeight) + 1);
    return { copyHeight, copies };
  });

  // Base Velocities
  function columnFactor(index, varVal) {
    const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
    return 1 + varVal * pseudo;
  }

  const dirSign = direction === 'up' ? 1 : -1;
  const baseVelocities = cols.map((_, c) => {
    const altSign = c % 2 === 0 ? 1 : -1;
    return speed * columnFactor(c, variance) * dirSign * altSign;
  });

  const offsets = columnMeta.map((meta, c) => meta.copyHeight * ((c * 0.37) % 1));
  const velocities = cols.map(() => 0);

  const pointer = { x: 0, y: 0 };
  const pointerDamped = { x: 0, y: 0 };

  // Setup DOM
  container.innerHTML = '';
  container.classList.add('drift-wall');
  container.style.setProperty('--dw-tile-w', `${tileWidth}px`);
  container.style.setProperty('--dw-tile-h', `${tileHeight}px`);
  container.style.setProperty('--dw-gap', `${gap}px`);
  container.style.setProperty('--dw-radius', `${radius}px`);
  container.style.setProperty('--dw-perspective', `${perspective}px`);

  container.style.setProperty('--dw-dim', dim);
  container.style.setProperty('--dw-overlay', overlayColor);
  container.style.setProperty('--dw-edge', `${Math.max(0, (1 - fade) * 100)}%`);

  const plane = document.createElement('div');
  plane.className = 'drift-wall__plane';
  container.appendChild(plane);

  const trackRefs = [];

  cols.forEach((col, c) => {
    const meta = columnMeta[c];
    const colDiv = document.createElement('div');
    colDiv.className = 'drift-wall__col';

    const trackDiv = document.createElement('div');
    trackDiv.className = 'drift-wall__track';
    trackRefs[c] = trackDiv;

    for (let copyIdx = 0; copyIdx < meta.copies; copyIdx++) {
      col.forEach((item, itemIdx) => {
        const tileEl = document.createElement('div');
        tileEl.className = 'drift-wall__tile';

        const innerSpan = document.createElement('span');
        innerSpan.className = 'drift-wall__inner';

        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.title || '';
        img.width = tileWidth;
        img.height = tileHeight;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.draggable = false;

        const overlaySpan = document.createElement('span');
        overlaySpan.className = 'drift-wall__overlay';
        overlaySpan.setAttribute('aria-hidden', 'true');

        innerSpan.appendChild(img);
        innerSpan.appendChild(overlaySpan);
        tileEl.appendChild(innerSpan);
        trackDiv.appendChild(tileEl);
      });
    }

    colDiv.appendChild(trackDiv);
    plane.appendChild(colDiv);
  });

  // --- Plane Transform ---
  function applyPlaneTransform(px, py) {
    if (!plane) return;
    plane.style.transform =
      `translate(-50%, -50%) scale(1.18) ` +
      `rotateX(${tilt + py}deg) rotateY(${turn + px}deg) rotateZ(${roll}deg) ` +
      `translateZ(${-depth}px)`;
  }

  // --- Animation Loop (drift only, no hover logic) ---
  function animate(ts) {
    if (lastTs === null) lastTs = ts;
    const dt = Math.min(0.05, Math.max(0, ts - lastTs) / 1000);
    lastTs = ts;

    // Parallax
    const maxTilt = parallax * 8;
    const targetX = pointer.x * maxTilt;
    const targetY = -pointer.y * maxTilt;
    const pointerDamp = 1 - Math.exp(-dt / 0.18);
    pointerDamped.x += (targetX - pointerDamped.x) * pointerDamp;
    pointerDamped.y += (targetY - pointerDamped.y) * pointerDamp;
    applyPlaneTransform(pointerDamped.x, pointerDamped.y);

    // Column drift — no stopping, always smooth
    for (let c = 0; c < trackRefs.length; c++) {
      const meta = columnMeta[c];
      if (!meta) continue;

      const velEase = 1 - Math.exp(-dt / 0.32);
      velocities[c] += (baseVelocities[c] - velocities[c]) * velEase;
      let next = (offsets[c] ?? 0) + velocities[c] * dt;
      next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
      offsets[c] = next;

      const el = trackRefs[c];
      if (el) el.style.transform = `translate3d(0, ${-next}px, 0)`;
    }

    if (isIntersecting) {
      rafId = requestAnimationFrame(animate);
    } else {
      rafId = null;
    }
  }

  let isIntersecting = false;
  const observer = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isIntersecting = entry.isIntersecting;
          if (isIntersecting) {
            if (!rafId) {
              lastTs = null;
              rafId = requestAnimationFrame(animate);
            }
          } else {
            if (rafId) {
              cancelAnimationFrame(rafId);
              rafId = null;
            }
          }
        });
      }, { threshold: 0.01 })
    : null;

  if (observer) {
    observer.observe(container);
  } else {
    isIntersecting = true;
    rafId = requestAnimationFrame(animate);
  }

  // --- Parallax pointer tracking only ---
  function handlePointerMove(e) {
    if (parallax > 0) {
      const rect = container.getBoundingClientRect();
      pointer.x = (e.clientX - rect.left) / rect.width - 0.5;
      pointer.y = (e.clientY - rect.top) / rect.height - 0.5;
    }
  }

  function handlePointerLeave() {
    pointer.x = 0;
    pointer.y = 0;
  }

  container.addEventListener('pointermove', handlePointerMove);
  container.addEventListener('pointerleave', handlePointerLeave);

  return {
    destroy() {
      if (rafId) cancelAnimationFrame(rafId);
      if (observer) observer.disconnect();
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
      container.innerHTML = '';
    }
  };
}
