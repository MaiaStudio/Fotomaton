/* ==========================================================================
   STICKER PEEL - Vanilla JS Module (adapted from React Bits StickerPeel)
   ========================================================================== */

export function createStickerPeel(parent, {
  imageSrc,
  width = 200,
  peelBackHoverPct = 20,
  peelBackActivePct = 38,
  initialX = 0,
  initialY = 0,
  rotate = 0
} = {}) {
  const padding = 10;

  // CSS custom props
  const vars = {
    '--sticker-width':           `${width}px`,
    '--sticker-p':               `${padding}px`,
    '--sticker-start':           `calc(-1 * ${padding}px)`,
    '--sticker-end':             `calc(100% + ${padding}px)`,
    '--sticker-peelback-hover':  `${peelBackHoverPct}%`,
    '--sticker-peelback-active': `${peelBackActivePct}%`,
  };

  // Wrapper (draggable)
  const wrapper = document.createElement('div');
  wrapper.className = 'sticker-peel-wrapper';
  Object.entries(vars).forEach(([k, v]) => wrapper.style.setProperty(k, v));
  wrapper.style.left = `${initialX}px`;
  wrapper.style.top  = `${initialY}px`;
  if (rotate) wrapper.style.transform = `rotate(${rotate}deg)`;

  // Inner container (handles hover CSS states)
  const container = document.createElement('div');
  container.className = 'sticker-container';

  // Main (visible) sticker
  const main = document.createElement('div');
  main.className = 'sticker-main';
  const mainImg = document.createElement('img');
  mainImg.src = imageSrc;
  mainImg.alt = '';
  mainImg.width = width;
  mainImg.height = width;
  mainImg.draggable = false;
  mainImg.addEventListener('contextmenu', e => e.preventDefault());
  main.appendChild(mainImg);

  // Flap (peeled-back underside)
  const flap = document.createElement('div');
  flap.className = 'sticker-flap';
  const flapImg = document.createElement('img');
  flapImg.src = imageSrc;
  flapImg.alt = '';
  flapImg.width = width;
  flapImg.height = width;
  flapImg.draggable = false;
  flapImg.addEventListener('contextmenu', e => e.preventDefault());
  flap.appendChild(flapImg);

  container.appendChild(main);
  container.appendChild(flap);
  wrapper.appendChild(container);
  parent.appendChild(wrapper);

  // ── Drag logic ──────────────────────────────────────────────────
  let dragging = false;
  let startMouseX = 0, startMouseY = 0;
  let startElX = initialX, startElY = initialY;
  let currentX = initialX, currentY = initialY;
  let tiltRaf = null;

  function setPos(x, y) {
    currentX = x;
    currentY = y;
    wrapper.style.left = `${x}px`;
    wrapper.style.top  = `${y}px`;
  }

  wrapper.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    dragging   = true;
    startMouseX = e.clientX;
    startMouseY = e.clientY;
    startElX   = currentX;
    startElY   = currentY;
    wrapper.style.transition = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const dx = e.clientX - startMouseX;
    const dy = e.clientY - startMouseY;
    const tilt = Math.max(-22, Math.min(22, dx * 0.35));
    setPos(startElX + dx, startElY + dy);

    if (tiltRaf) cancelAnimationFrame(tiltRaf);
    tiltRaf = requestAnimationFrame(() => {
      const base = rotate ? rotate : 0;
      wrapper.style.transform = `rotate(${base + tilt}deg)`;
    });
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    wrapper.style.transition = '';
    // Spring back tilt
    const base = rotate ? rotate : 0;
    wrapper.style.transform = `rotate(${base}deg)`;
  });

  return wrapper;
}
