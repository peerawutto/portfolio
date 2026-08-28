import { Mesh, Program, Renderer, Triangle } from "https://esm.sh/ogl@1.0.11";

const VERTEX_SHADER = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;
const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform sampler2D uTexture;
uniform float uHasSource;
uniform float uSourceAspect;
uniform float uGenerator;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uPixelate;
uniform float uDither;
uniform float uRgbSplit;
uniform float uGlitch;
uniform float uScanlines;
uniform float uGrain;
uniform float uDuotone;
uniform float uEffectsVisible;
uniform float uBrightness;
uniform float uContrast;
uniform float uSaturation;
uniform float uHue;
uniform float uGrayscale;
uniform float uSepia;
uniform float uInvert;
uniform float uVignette;
uniform float uGlow;
uniform float uPosterize;
uniform float uEdgeGlow;
uniform float uPixelSort;
uniform float uLed;
uniform float uPixelSize;
uniform float uDensity;
uniform float uExposure;
uniform float uScatter;
uniform float uPixelOpacity;
uniform float uDitherAlgorithm;
uniform float uAnimationPreset;
uniform float uAnimationPace;
uniform float uAnimationIntensity;

out vec4 fragColor;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec3 generatedSource(vec2 uv) {
  float t = uTime * 0.5;
  uv.y += 0.03 * sin(8.0 * uv.x - t);
  float pattern = 0.6 + 0.4 * sin(
    5.0 * (
      uv.x + uv.y + cos(3.0 * uv.x + 5.0 * uv.y) + 0.02 * t
    ) + sin(20.0 * (uv.x + uv.y - 0.1 * t))
  );
  float silkGrain = hash21(gl_FragCoord.xy) / 15.0;
  vec3 color = mix(uColorA, uColorB, clamp(pattern, 0.0, 1.0));
  color = mix(color, uColorC, smoothstep(0.86, 1.0, pattern) * 0.32);
  color -= silkGrain * 0.11;
  return clamp(color, 0.0, 1.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  vec3 color = generatedSource(uv);

  color *= uBrightness;
  color = (color - 0.5) * uContrast + 0.5;
  float baseLuma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(vec3(baseLuma), color, uSaturation);

  if (uGrain > 0.001) {
    float grain = hash21(gl_FragCoord.xy + floor(uTime * 24.0)) - 0.5;
    color += grain * uGrain * 0.22;
  }

  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

const PRESET = {
  "generator": 3,
  "colors": ["#d8dfdf", "#e2a560", "#f2f6f1"],
  "settings": { "brightness": 99, "contrast": 114, "saturation": 86 },
  "grain": 0.18,
};

function hexToRgb(hex) {
  const value = parseInt(hex.replace("#", ""), 16);
  return new Float32Array([
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ]);
}

function initStudioBackground(container) {
  if (!container) return;

  const renderer = new Renderer({
    webgl: 2,
    alpha: false,
    antialias: false,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
  });
  const gl = renderer.gl;
  const canvas = gl.canvas;
  Object.assign(canvas.style, {
    width: "100%",
    height: "100%",
    display: "block",
  });
  container.appendChild(canvas);

  const geometry = new Triangle(gl);
  const program = new Program(gl, {
    vertex: VERTEX_SHADER,
    fragment: FRAGMENT_SHADER,
    uniforms: {
      uResolution: { value: new Float32Array([1, 1]) },
      uTime: { value: 0 },
      uColorA: { value: hexToRgb(PRESET.colors[0]) },
      uColorB: { value: hexToRgb(PRESET.colors[1]) },
      uColorC: { value: hexToRgb(PRESET.colors[2]) },
      uGrain: { value: PRESET.grain },
      uBrightness: { value: PRESET.settings.brightness / 100 },
      uContrast: { value: PRESET.settings.contrast / 100 },
      uSaturation: { value: PRESET.settings.saturation / 100 },
    },
  });
  const mesh = new Mesh(gl, { geometry, program });

  const resize = () => {
    const bounds = container.getBoundingClientRect();
    renderer.setSize(
      Math.max(1, Math.round(bounds.width)),
      Math.max(1, Math.round(bounds.height))
    );
    const resolution = program.uniforms.uResolution.value;
    resolution[0] = gl.drawingBufferWidth;
    resolution[1] = gl.drawingBufferHeight;
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  let frame = 0;
  let elapsed = 0;
  let previous = 0;
  const render = (now) => {
    if (!previous) previous = now;
    elapsed += Math.min(40, now - previous);
    previous = now;
    program.uniforms.uTime.value = elapsed / 1000;
    renderer.render({ scene: mesh });
    frame = requestAnimationFrame(render);
  };
  frame = requestAnimationFrame(render);

  // No cleanup function needed for this simple case, but in a more complex app
  // you'd want to handle cancelAnimationFrame, observer.disconnect, etc.
}

initStudioBackground(document.querySelector("#hero-background"));