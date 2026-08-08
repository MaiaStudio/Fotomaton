function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 1, 1];
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
}

function colorModeToFloat(mode) {
  return mode === 'ember' ? 1 : mode === 'frost' ? 2 : 0;
}

export function createMoltenMetal(parent, options = {}) {
  if (!parent) return null;

  const {
    color1 = '#000000',
    color2 = '#ff2937',
    color3 = '#FFFFFF',
    speed = 0.35,
    scale = 4,
    detail = 3,
    glow = 1.6,
    coreSize = 0.1,
    swirl = 1,
    fold = -0.2,
    blackPoint = 0.05,
    brightness = 1.3,
    colorMode = 'molten',
    grain = true,
    grainIntensity = 0.05,
    mouseInteraction = true,
    mouseStrength = 0.3,
    opacity = 1.0,
    zIndex = 0
  } = options;

  // Ensure parent positioning
  const prevParentPos = window.getComputedStyle(parent).position;
  if (!prevParentPos || prevParentPos === 'static') {
    parent.style.position = 'relative';
  }

  // Create Container & Canvas
  const container = document.createElement('div');
  container.className = 'molten-metal-container';
  container.style.position = 'absolute';
  container.style.inset = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.overflow = 'hidden';
  container.style.pointerEvents = 'none';
  container.style.zIndex = String(zIndex);

  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);

  parent.insertBefore(container, parent.firstChild);

  // WebGL 2 Context
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    powerPreference: 'high-performance'
  });

  if (!gl) {
    console.warn('WebGL2 not supported for MoltenMetal effect');
    return null;
  }

  // Shaders
  const vsSource = `#version 300 es
  in vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }`;

  const fsSource = `#version 300 es
  precision highp float;
  uniform vec2 iResolution;
  uniform float iTime;
  uniform float uSpeed;
  uniform float uScale;
  uniform float uDetail;
  uniform float uGlow;
  uniform float uCoreSize;
  uniform float uSwirl;
  uniform float uFold;
  uniform float uBlackPoint;
  uniform float uBrightness;
  uniform float uColorMode;
  uniform float uGrain;
  uniform float uGrainIntensity;
  uniform float uOpacity;
  uniform vec2 uMouse;
  uniform float uMouseStrength;
  uniform bool uEnableMouse;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  out vec4 fragColor;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    float time = iTime * uSpeed;
    vec2 p = uScale * ((gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y) - 0.5;

    vec2 drift = vec2(0.0);
    if (uEnableMouse) {
      drift = (uMouse - 0.5) * uMouseStrength * 2.0;
    }
    p += drift;

    vec2 i = p;
    float c = 0.0;
    float r = length(p + vec2(sin(time), sin(time * 0.3 + 5.0)) * 0.5);
    float d = length(p);
    float rot = d + time + p.x * uSwirl;

    float cosRot = cos(rot);
    mat2 warp = mat2(cos(rot - sin(time / 5.0)), sin(rot), -sin(cosRot - time), cosRot) * uFold;
    float glowCore = uGlow * uCoreSize;

    for (float n = 0.0; n < 8.0; n++) {
      if (n >= uDetail) break;
      p *= warp;
      float t = r - time / (n + 3.0);
      i -= p + vec2(cos(t - i.x - r) + sin(t + i.y), sin(t - i.y) + cos(t + i.x) + r);
      c += glowCore / length(vec2(sin(i.x + t), cos(i.y + t)));
    }

    c /= 6.0;

    float intensity = max(c - uBlackPoint, 0.0) * uBrightness;

    float g = clamp(intensity, 0.0, 1.0);

    float mid = 0.5;
    if (uColorMode > 1.5) {
      mid = 0.65;
    } else if (uColorMode > 0.5) {
      mid = 0.35;
    }

    vec3 col = mix(uColor1, uColor2, smoothstep(0.0, mid, g));
    col = mix(col, uColor3, smoothstep(mid, 1.0, g));

    float a = g;
    if (uGrain > 0.5) {
      float gr = hash(gl_FragCoord.xy + iTime);
      a += (gr - 0.5) * uGrainIntensity;
    }
    a = clamp(a, 0.0, 1.0) * uOpacity;
    fragColor = vec4(col * a, a);
  }`;

  function compileShader(src, type) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  const vs = compileShader(vsSource, gl.VERTEX_SHADER);
  const fs = compileShader(fsSource, gl.FRAGMENT_SHADER);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return null;
  }

  gl.useProgram(program);

  // Fullscreen Triangle VBO
  const positionLoc = gl.getAttribLocation(program, 'position');
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

  // Uniform Locations
  const uLocs = {
    iResolution: gl.getUniformLocation(program, 'iResolution'),
    iTime: gl.getUniformLocation(program, 'iTime'),
    uSpeed: gl.getUniformLocation(program, 'uSpeed'),
    uScale: gl.getUniformLocation(program, 'uScale'),
    uDetail: gl.getUniformLocation(program, 'uDetail'),
    uGlow: gl.getUniformLocation(program, 'uGlow'),
    uCoreSize: gl.getUniformLocation(program, 'uCoreSize'),
    uSwirl: gl.getUniformLocation(program, 'uSwirl'),
    uFold: gl.getUniformLocation(program, 'uFold'),
    uBlackPoint: gl.getUniformLocation(program, 'uBlackPoint'),
    uBrightness: gl.getUniformLocation(program, 'uBrightness'),
    uColorMode: gl.getUniformLocation(program, 'uColorMode'),
    uGrain: gl.getUniformLocation(program, 'uGrain'),
    uGrainIntensity: gl.getUniformLocation(program, 'uGrainIntensity'),
    uOpacity: gl.getUniformLocation(program, 'uOpacity'),
    uMouse: gl.getUniformLocation(program, 'uMouse'),
    uMouseStrength: gl.getUniformLocation(program, 'uMouseStrength'),
    uEnableMouse: gl.getUniformLocation(program, 'uEnableMouse'),
    uColor1: gl.getUniformLocation(program, 'uColor1'),
    uColor2: gl.getUniformLocation(program, 'uColor2'),
    uColor3: gl.getUniformLocation(program, 'uColor3')
  };

  // Set Uniform Static Values
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const c3 = hexToRgb(color3);

  gl.uniform1f(uLocs.uSpeed, speed);
  gl.uniform1f(uLocs.uScale, scale);
  gl.uniform1f(uLocs.uDetail, detail);
  gl.uniform1f(uLocs.uGlow, glow);
  gl.uniform1f(uLocs.uCoreSize, Math.max(coreSize, 0.001));
  gl.uniform1f(uLocs.uSwirl, swirl);
  gl.uniform1f(uLocs.uFold, fold);
  gl.uniform1f(uLocs.uBlackPoint, blackPoint);
  gl.uniform1f(uLocs.uBrightness, brightness);
  gl.uniform1f(uLocs.uColorMode, colorModeToFloat(colorMode));
  gl.uniform1f(uLocs.uGrain, grain ? 1 : 0);
  gl.uniform1f(uLocs.uGrainIntensity, grainIntensity);
  gl.uniform1f(uLocs.uOpacity, opacity);
  gl.uniform1f(uLocs.uMouseStrength, mouseStrength);
  gl.uniform1i(uLocs.uEnableMouse, mouseInteraction ? 1 : 0);
  gl.uniform3fv(uLocs.uColor1, c1);
  gl.uniform3fv(uLocs.uColor2, c2);
  gl.uniform3fv(uLocs.uColor3, c3);

  // Resize handling
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = container.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uLocs.iResolution, w, h);
    }
  }

  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  // Mouse Tracking
  const targetMouse = [0.5, 0.5];
  const currentMouse = [0.5, 0.5];

  function handleMouseMove(e) {
    const rect = parent.getBoundingClientRect();
    targetMouse[0] = (e.clientX - rect.left) / rect.width;
    targetMouse[1] = 1.0 - (e.clientY - rect.top) / rect.height;
  }

  function handleMouseLeave() {
    targetMouse[0] = 0.5;
    targetMouse[1] = 0.5;
  }

  if (mouseInteraction) {
    parent.addEventListener('mousemove', handleMouseMove);
    parent.addEventListener('mouseleave', handleMouseLeave);
  }

  // Animation Loop & Intersection Observer
  let rafId = 0;
  let isVisible = true;
  let isPageVisible = !document.hidden;
  const startTime = performance.now();

  function render(t) {
    gl.useProgram(program);
    gl.bindVertexArray(vao);

    gl.uniform1f(uLocs.iTime, (t - startTime) * 0.001);

    if (mouseInteraction) {
      currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
      currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
      gl.uniform2fv(uLocs.uMouse, currentMouse);
    }

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    rafId = requestAnimationFrame(render);
  }

  function startLoop() {
    if (isVisible && isPageVisible && rafId === 0) {
      rafId = requestAnimationFrame(render);
    }
  }

  function stopLoop() {
    if (rafId !== 0) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  const io = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    isVisible ? startLoop() : stopLoop();
  }, { threshold: 0 });

  io.observe(container);

  function handleVisibilityChange() {
    isPageVisible = !document.hidden;
    isPageVisible ? startLoop() : stopLoop();
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);
  startLoop();

  return {
    destroy() {
      stopLoop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (mouseInteraction) {
        parent.removeEventListener('mousemove', handleMouseMove);
        parent.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  };
}
