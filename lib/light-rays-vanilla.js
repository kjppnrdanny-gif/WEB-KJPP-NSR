import { Renderer, Program, Triangle, Mesh } from 'ogl';

const DEFAULT_COLOR = '#38bdf8';

const hexToRgb = hex => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [1, 1, 1];
};

const getAnchorAndDir = (origin, w, h) => {
  const outside = 0.2;
  switch (origin) {
    case 'top-left':
      return { anchor: [0, -outside * h], dir: [0, 1] };
    case 'top-right':
      return { anchor: [w, -outside * h], dir: [0, 1] };
    case 'left':
      return { anchor: [-outside * w, 0.5 * h], dir: [1, 0] };
    case 'right':
      return { anchor: [(1 + outside) * w, 0.5 * h], dir: [-1, 0] };
    case 'bottom-left':
      return { anchor: [0, (1 + outside) * h], dir: [0, -1] };
    case 'bottom-center':
      return { anchor: [0.5 * w, (1 + outside) * h], dir: [0, -1] };
    case 'bottom-right':
      return { anchor: [w, (1 + outside) * h], dir: [0, -1] };
    default: // "top-center"
      return { anchor: [0.5 * w, -outside * h], dir: [0, 1] };
  }
};

export function initLightRays(container, userOptions = {}) {
  if (!container) return null;

  let opts = {
    raysOrigin: 'top-center',
    raysColor: DEFAULT_COLOR,
    raysSpeed: 1,
    lightSpread: 1,
    rayLength: 2,
    pulsating: false,
    fadeDistance: 1.0,
    saturation: 1.0,
    followMouse: true,
    mouseInfluence: 0.1,
    noiseAmount: 0.0,
    distortion: 0.0,
    lightMode: false,
    ...userOptions
  };

  let renderer = null;
  let uniforms = null;
  let mesh = null;
  let animationId = null;
  let isVisible = true;
  let observer = null;

  const mouseRef = { x: 0.5, y: 0.5 };
  const smoothMouseRef = { x: 0.5, y: 0.5 };

  const handleMouseMove = e => {
    if (!container || !renderer) return;
    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseRef.x = x;
    mouseRef.y = y;
  };

  if (opts.followMouse) {
    window.addEventListener('mousemove', handleMouseMove);
  }

  const vert = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

  const frag = `precision highp float;

uniform float iTime;
uniform vec2  iResolution;

uniform vec2  rayPos;
uniform vec2  rayDir;
uniform vec3  raysColor;
uniform float raysSpeed;
uniform float lightSpread;
uniform float rayLength;
uniform float pulsating;
uniform float fadeDistance;
uniform float saturation;
uniform vec2  mousePos;
uniform float mouseInfluence;
uniform float noiseAmount;
uniform float distortion;
uniform float lightMode;

varying vec2 vUv;

float noise(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord,
                  float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  vec2 dirNorm = normalize(sourceToCoord);
  float cosAngle = dot(dirNorm, rayRefDirection);

  float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;
  
  float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));

  float distance = length(sourceToCoord);
  float maxDistance = iResolution.x * rayLength;
  float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);
  
  float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0);
  float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;

  float baseStrength = clamp(
    (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)),
    0.0, 1.0
  );

  return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  
  vec2 finalRayDir = rayDir;
  if (mouseInfluence > 0.0) {
    vec2 mouseScreenPos = mousePos * iResolution.xy;
    vec2 mouseDirection = normalize(mouseScreenPos - rayPos);
    finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
  }

  vec4 rays1 = vec4(1.0) *
               rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349,
                           1.5 * raysSpeed);
  vec4 rays2 = vec4(1.0) *
               rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234,
                           1.1 * raysSpeed);

  fragColor = rays1 * 0.5 + rays2 * 0.4;

  if (noiseAmount > 0.0) {
    float n = noise(coord * 0.01 + iTime * 0.1);
    fragColor.rgb *= (1.0 - noiseAmount + noiseAmount * n);
  }

  float brightness = 1.0 - (coord.y / iResolution.y);
  fragColor.x *= 0.1 + brightness * 0.8;
  fragColor.y *= 0.3 + brightness * 0.6;
  fragColor.z *= 0.5 + brightness * 0.5;

  if (saturation != 1.0) {
    float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114));
    fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation);
  }

  fragColor.rgb *= raysColor;

  if (lightMode > 0.5) {
    vec3 mapped = vec3(1.0) - exp(-max(fragColor.rgb, vec3(0.0)) * 1.35);
    float energy = clamp(max(mapped.r, max(mapped.g, mapped.b)), 0.0, 1.0);
    vec3 hue = mapped / max(energy, 0.0001);
    vec3 ink = mix(hue * 0.25, hue * 0.72, energy);
    fragColor = vec4(mix(vec3(1.0), ink, energy), 1.0);
  }
}

void main() {
  vec4 color;
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor  = color;
}`;

  function updatePlacement() {
    if (!container || !renderer || !uniforms) return;

    renderer.dpr = Math.min(window.devicePixelRatio || 1, 2);

    const { clientWidth: wCSS, clientHeight: hCSS } = container;
    if (wCSS === 0 || hCSS === 0) return;

    renderer.setSize(wCSS, hCSS);

    const dpr = renderer.dpr;
    const w = wCSS * dpr;
    const h = hCSS * dpr;

    uniforms.iResolution.value = [w, h];

    const { anchor, dir } = getAnchorAndDir(opts.raysOrigin, w, h);
    uniforms.rayPos.value = anchor;
    uniforms.rayDir.value = dir;
  }

  function loop(t) {
    if (!renderer || !uniforms || !mesh) return;

    if (isVisible) {
      uniforms.iTime.value = t * 0.001;

      if (opts.followMouse && opts.mouseInfluence > 0.0) {
        const smoothing = 0.92;
        smoothMouseRef.x = smoothMouseRef.x * smoothing + mouseRef.x * (1 - smoothing);
        smoothMouseRef.y = smoothMouseRef.y * smoothing + mouseRef.y * (1 - smoothing);
        uniforms.mousePos.value = [smoothMouseRef.x, smoothMouseRef.y];
      }

      try {
        renderer.render({ scene: mesh });
      } catch (error) {
        console.warn('WebGL rendering error:', error);
        return;
      }
    }

    animationId = requestAnimationFrame(loop);
  }

  function init() {
    try {
      renderer = new Renderer({
        dpr: Math.min(window.devicePixelRatio || 1, 2),
        alpha: true,
        antialias: false,
        powerPreference: 'high-performance'
      });

      const gl = renderer.gl;
      if (!gl) {
        console.warn('WebGL not supported');
        return;
      }

      gl.canvas.style.width = '100%';
      gl.canvas.style.height = '100%';
      gl.canvas.style.display = 'block';
      gl.canvas.style.position = 'absolute';
      gl.canvas.style.inset = '0';
      gl.canvas.style.pointerEvents = 'none';

      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(gl.canvas);

      uniforms = {
        iTime: { value: 0 },
        iResolution: { value: [1, 1] },
        rayPos: { value: [0, 0] },
        rayDir: { value: [0, 1] },
        raysColor: { value: hexToRgb(opts.raysColor) },
        raysSpeed: { value: opts.raysSpeed },
        lightSpread: { value: opts.lightSpread },
        rayLength: { value: opts.rayLength },
        pulsating: { value: opts.pulsating ? 1.0 : 0.0 },
        fadeDistance: { value: opts.fadeDistance },
        saturation: { value: opts.saturation },
        mousePos: { value: [0.5, 0.5] },
        mouseInfluence: { value: opts.mouseInfluence },
        noiseAmount: { value: opts.noiseAmount },
        distortion: { value: opts.distortion },
        lightMode: { value: opts.lightMode ? 1.0 : 0.0 }
      };

      const geometry = new Triangle(gl);
      const program = new Program(gl, {
        vertex: vert,
        fragment: frag,
        uniforms
      });
      mesh = new Mesh(gl, { geometry, program });

      window.addEventListener('resize', updatePlacement);
      updatePlacement();
      animationId = requestAnimationFrame(loop);

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
    } catch (err) {
      console.warn('LightRays initialization failed:', err);
    }
  }

  init();

  return {
    update(newOpts) {
      opts = { ...opts, ...newOpts };
      if (!uniforms || !renderer) return;

      uniforms.raysColor.value = hexToRgb(opts.raysColor);
      uniforms.raysSpeed.value = opts.raysSpeed;
      uniforms.lightSpread.value = opts.lightSpread;
      uniforms.rayLength.value = opts.rayLength;
      uniforms.pulsating.value = opts.pulsating ? 1.0 : 0.0;
      uniforms.fadeDistance.value = opts.fadeDistance;
      uniforms.saturation.value = opts.saturation;
      uniforms.mouseInfluence.value = opts.mouseInfluence;
      uniforms.noiseAmount.value = opts.noiseAmount;
      uniforms.distortion.value = opts.distortion;
      uniforms.lightMode.value = opts.lightMode ? 1.0 : 0.0;

      const { clientWidth: wCSS, clientHeight: hCSS } = container;
      const dpr = renderer.dpr;
      const { anchor, dir } = getAnchorAndDir(opts.raysOrigin, wCSS * dpr, hCSS * dpr);
      uniforms.rayPos.value = anchor;
      uniforms.rayDir.value = dir;
    },
    destroy() {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      if (opts.followMouse) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      window.removeEventListener('resize', updatePlacement);
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (renderer) {
        try {
          const canvas = renderer.gl.canvas;
          const loseContextExt = renderer.gl.getExtension('WEBGL_lose_context');
          if (loseContextExt) {
            loseContextExt.loseContext();
          }
          if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
          }
        } catch (e) {
          console.warn('Error during WebGL destroy:', e);
        }
      }
      renderer = null;
      uniforms = null;
      mesh = null;
    }
  };
}

if (typeof window !== 'undefined') {
  window.initLightRays = initLightRays;
}
