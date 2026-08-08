import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export function createGhostCursor(parent, options = {}) {
  if (!parent) return null;

  const {
    trailLength = 20,
    inertia = 0.4,
    grainIntensity = 0.03,
    bloomStrength = 0.08,
    bloomRadius = 0.8,
    bloomThreshold = 0.03,
    brightness = 1.1,
    color = '#FF2A38',
    mixBlendMode = 'screen',
    edgeIntensity = 0,
    maxDevicePixelRatio = 0.75,
    targetPixels = 0.35e6,
    fadeDelayMs = 600,
    fadeDurationMs = 1000,
    zIndex = 0
  } = options;

  const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  if (isTouch) return null; // Disable heavy WebGL cursor effect on touch devices for maximum mobile performance

  const pixelBudget = targetPixels;
  const fadeDelay = fadeDelayMs;
  const fadeDuration = fadeDurationMs;

  // Host container element for the canvas
  const host = document.createElement('div');
  host.className = 'ghost-cursor-container';
  host.style.position = 'absolute';
  host.style.inset = '0';
  host.style.pointerEvents = 'none';
  host.style.zIndex = String(zIndex);
  host.style.overflow = 'hidden';

  const prevParentPos = window.getComputedStyle(parent).position;
  if (!prevParentPos || prevParentPos === 'static') {
    parent.style.position = 'relative';
  }

  parent.insertBefore(host, parent.firstChild);

  // State refs
  let active = true;
  let running = false;
  let hasValidSize = false;
  let isIntersecting = false;
  let rafId = null;
  let resizeObs = null;
  let intersectObs = null;

  const currentMouse = new THREE.Vector2(0.5, 0.5);
  const velocity = new THREE.Vector2(0, 0);
  let fadeOpacity = 1.0;
  let lastMoveTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  let pointerActive = false;

  const maxTrail = Math.max(1, Math.floor(trailLength));
  const trailBuf = Array.from({ length: maxTrail }, () => new THREE.Vector2(0.5, 0.5));
  let head = 0;

  const baseVertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  // Optimized shader with 3 FBM octaves and stepped trail loop
  const fragmentShader = `
    uniform float iTime;
    uniform vec3  iResolution;
    uniform vec2  iMouse;
    uniform vec2  iPrevMouse[MAX_TRAIL_LENGTH];
    uniform float iOpacity;
    uniform float iScale;
    uniform vec3  iBaseColor;
    uniform float iBrightness;
    uniform float iEdgeIntensity;
    varying vec2  vUv;

    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7))) * 43758.5453123); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      f *= f * (3. - 2. * f);
      return mix(mix(hash(i + vec2(0.,0.)), hash(i + vec2(1.,0.)), f.x),
                 mix(hash(i + vec2(0.,1.)), hash(i + vec2(1.,1.)), f.x), f.y);
    }
    float fbm(vec2 p){
      float v = 0.0;
      float a = 0.5;
      mat2 m = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
      for(int i = 0; i < 3; i++){
        v += a * noise(p);
        p = m * p * 2.0;
        a *= 0.5;
      }
      return v;
    }

    vec4 blob(vec2 p, vec2 mousePos, float intensity, float activity) {
      vec2 q = vec2(fbm(p * iScale + iTime * 0.1), fbm(p * iScale + vec2(5.2,1.3) + iTime * 0.1));
      float smoke = fbm(p * iScale + q * 0.8);
      float radius = 0.4 + 0.25 * (1.0 / iScale);
      float distFactor = 1.0 - smoothstep(0.0, radius * activity, length(p - mousePos));
      float alpha = pow(smoke, 2.2) * distFactor;

      vec3 c1 = mix(iBaseColor, vec3(1.0), 0.15);
      vec3 c2 = mix(iBaseColor, vec3(1.0, 0.4, 0.4), 0.25);
      vec3 col = mix(c1, c2, sin(iTime * 0.5) * 0.5 + 0.5);

      return vec4(col * alpha * intensity, alpha * intensity);
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy / iResolution.xy * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
      vec2 mouse = (iMouse * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);

      vec3 colorAcc = vec3(0.0);
      float alphaAcc = 0.0;

      vec4 b = blob(uv, mouse, 1.0, iOpacity);
      colorAcc += b.rgb;
      alphaAcc += b.a;

      for (int i = 0; i < MAX_TRAIL_LENGTH; i += 2) {
        vec2 pm = (iPrevMouse[i] * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
        float t = 1.0 - float(i) / float(MAX_TRAIL_LENGTH);
        t = t * t;
        if (t > 0.05) {
          vec4 bt = blob(uv, pm, t * 0.7, iOpacity);
          colorAcc += bt.rgb;
          alphaAcc += bt.a;
        }
      }

      colorAcc *= iBrightness;

      float outAlpha = clamp(alphaAcc * iOpacity, 0.0, 1.0);
      gl_FragColor = vec4(colorAcc, outAlpha);
    }
  `;

  const FilmGrainShader = {
    uniforms: {
      tDiffuse: { value: null },
      iTime: { value: 0 },
      intensity: { value: grainIntensity }
    },
    vertexShader: `
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float iTime;
      uniform float intensity;
      varying vec2 vUv;

      float hash1(float n){ return fract(sin(n)*43758.5453); }

      void main(){
        vec4 color = texture2D(tDiffuse, vUv);
        float n = hash1(vUv.x*1000.0 + vUv.y*2000.0 + iTime) * 2.0 - 1.0;
        color.rgb += n * intensity * color.rgb;
        gl_FragColor = color;
      }
    `
  };

  const UnpremultiplyPass = new ShaderPass({
    uniforms: { tDiffuse: { value: null } },
    vertexShader: `
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      varying vec2 vUv;
      void main(){
        vec4 c = texture2D(tDiffuse, vUv);
        float a = max(c.a, 1e-5);
        vec3 straight = c.rgb / a;
        gl_FragColor = vec4(clamp(straight, 0.0, 1.0), c.a);
      }
    `
  });

  function calculateScale(el) {
    const r = el.getBoundingClientRect();
    const current = Math.min(Math.max(1, r.width), Math.max(1, r.height));
    return Math.max(0.5, Math.min(1.5, current / 600));
  }

  // Renderer setup
  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: true,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
    premultipliedAlpha: false,
    preserveDrawingBuffer: false
  });
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.inset = '0';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.pointerEvents = 'none';
  if (mixBlendMode) {
    renderer.domElement.style.mixBlendMode = String(mixBlendMode);
  }

  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const geom = new THREE.PlaneGeometry(2, 2);
  const baseColor = new THREE.Color(color);

  const material = new THREE.ShaderMaterial({
    defines: { MAX_TRAIL_LENGTH: maxTrail },
    uniforms: {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector3(1, 1, 1) },
      iMouse: { value: new THREE.Vector2(0.5, 0.5) },
      iPrevMouse: { value: trailBuf.map(v => v.clone()) },
      iOpacity: { value: 1.0 },
      iScale: { value: 1.0 },
      iBaseColor: { value: new THREE.Vector3(baseColor.r, baseColor.g, baseColor.b) },
      iBrightness: { value: brightness },
      iEdgeIntensity: { value: edgeIntensity }
    },
    vertexShader: baseVertexShader,
    fragmentShader,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });

  const mesh = new THREE.Mesh(geom, material);
  scene.add(mesh);

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), bloomStrength, bloomRadius, bloomThreshold);
  composer.addPass(bloomPass);

  const filmPass = new ShaderPass(FilmGrainShader);
  composer.addPass(filmPass);
  composer.addPass(UnpremultiplyPass);

  const resize = () => {
    if (!active) return;
    const rect = host.getBoundingClientRect();
    const cssW = Math.floor(rect.width);
    const cssH = Math.floor(rect.height);

    if (cssW <= 0 || cssH <= 0) {
      hasValidSize = false;
      return;
    }

    const currentDPR = Math.min(window.devicePixelRatio || 1, maxDevicePixelRatio);
    const need = cssW * cssH * currentDPR * currentDPR;
    const scale = need <= pixelBudget ? 1 : Math.max(0.4, Math.min(1, Math.sqrt(pixelBudget / Math.max(1, need))));
    const pixelRatio = currentDPR * scale;

    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(cssW, cssH, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    composer.setPixelRatio?.(pixelRatio);
    composer.setSize(cssW, cssH);

    const wpx = Math.max(1, Math.floor(cssW * pixelRatio));
    const hpx = Math.max(1, Math.floor(cssH * pixelRatio));
    material.uniforms.iResolution.value.set(wpx, hpx, 1);
    material.uniforms.iScale.value = calculateScale(host);
    bloomPass.setSize(wpx, hpx);

    hasValidSize = true;
  };

  resize();
  resizeObs = new ResizeObserver(() => {
    if (active) resize();
  });
  resizeObs.observe(parent);
  resizeObs.observe(host);

  // IntersectionObserver: PAUSE rendering completely when offscreen!
  intersectObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isIntersecting = entry.isIntersecting;
      if (!isIntersecting) {
        pointerActive = false;
      }
    });
  }, { threshold: 0.05 });
  intersectObs.observe(parent);

  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const animate = () => {
    if (!active) return;

    if (!isIntersecting || !hasValidSize) {
      running = false;
      rafId = null;
      return;
    }

    const now = performance.now();
    const t = (now - startTime) / 1000;

    if (pointerActive) {
      velocity.set(
        currentMouse.x - material.uniforms.iMouse.value.x,
        currentMouse.y - material.uniforms.iMouse.value.y
      );
      material.uniforms.iMouse.value.copy(currentMouse);
      fadeOpacity = 1.0;
    } else {
      velocity.multiplyScalar(inertia);
      if (velocity.lengthSq() > 1e-6) {
        material.uniforms.iMouse.value.add(velocity);
      }
      const dt = now - lastMoveTime;
      if (dt > fadeDelay) {
        const k = Math.min(1, (dt - fadeDelay) / fadeDuration);
        fadeOpacity = Math.max(0, 1 - k);
      }
    }

    const N = trailBuf.length;
    head = (head + 1) % N;
    trailBuf[head].copy(material.uniforms.iMouse.value);
    const arr = material.uniforms.iPrevMouse.value;
    for (let i = 0; i < N; i++) {
      const srcIdx = (head - i + N) % N;
      arr[i].copy(trailBuf[srcIdx]);
    }

    material.uniforms.iOpacity.value = fadeOpacity;
    material.uniforms.iTime.value = t;

    if (filmPass.uniforms?.iTime) {
      filmPass.uniforms.iTime.value = t;
    }

    composer.render();

    if (!pointerActive && fadeOpacity <= 0.005) {
      running = false;
      rafId = null;
      return;
    }

    rafId = requestAnimationFrame(animate);
  };

  const ensureLoop = () => {
    if (!running && isIntersecting) {
      running = true;
      rafId = requestAnimationFrame(animate);
    }
  };

  const onPointerMove = (e) => {
    if (!isIntersecting) return;
    const rect = parent.getBoundingClientRect();
    const x = THREE.MathUtils.clamp((e.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
    const y = THREE.MathUtils.clamp(1 - (e.clientY - rect.top) / Math.max(1, rect.height), 0, 1);
    currentMouse.set(x, y);
    pointerActive = true;
    lastMoveTime = performance.now();
    ensureLoop();
  };

  const onPointerEnter = () => {
    if (!isIntersecting) return;
    pointerActive = true;
    ensureLoop();
  };

  const onPointerLeave = () => {
    pointerActive = false;
    lastMoveTime = performance.now();
    ensureLoop();
  };

  parent.addEventListener('pointermove', onPointerMove, { passive: true });
  parent.addEventListener('pointerenter', onPointerEnter, { passive: true });
  parent.addEventListener('pointerleave', onPointerLeave, { passive: true });

  return function destroy() {
    active = false;
    hasValidSize = false;
    isIntersecting = false;
    if (rafId) cancelAnimationFrame(rafId);
    running = false;

    parent.removeEventListener('pointermove', onPointerMove);
    parent.removeEventListener('pointerenter', onPointerEnter);
    parent.removeEventListener('pointerleave', onPointerLeave);
    resizeObs?.disconnect();
    intersectObs?.disconnect();

    scene.clear();
    geom.dispose();
    material.dispose();
    composer.dispose();
    renderer.dispose();
    renderer.forceContextLoss();

    if (renderer.domElement && renderer.domElement.parentElement) {
      renderer.domElement.parentElement.removeChild(renderer.domElement);
    }
    if (host.parentElement) {
      host.parentElement.removeChild(host);
    }
  };
}
