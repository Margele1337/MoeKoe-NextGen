<template>
  <canvas ref="canvas" class="rise-bg-canvas"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const canvas = ref(null);
let gl = null;
let animFrameId = null;
let startTime = null;

// --- Vertex Shader (fullscreen quad) ---
const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

// --- Fragment Shader: Rise main menu background (background.frag) ---
// Original author: Hazsi
// Ported from GLSL to WebGL (GLSL ES 1.00)
const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

varying vec2 v_texCoord;

mat2 m(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
}

float map(vec3 p) {
    p.xz *= m(u_time * 0.4);
    p.xy *= m(u_time * 0.1);
    vec3 q = p * 2.0 + u_time;
    return length(p + vec3(sin(u_time * 0.7))) * log(length(p) + 1.0) + sin(q.x + sin(q.z + sin(q.y))) * 0.5 - 1.0;
}

void main() {
    vec2 a = v_texCoord * vec2(u_resolution.x / u_resolution.y, 1.0) - vec2(0.9, 0.5);
    vec3 cl = vec3(0.0);
    float d = 2.5;

    for (int i = 0; i <= 5; i++) {
        vec3 p = vec3(0.0, 0.0, 4.0) + normalize(vec3(a, -1.0)) * d;
        float rz = map(p);
        float f = clamp((rz - map(p + 0.1)) * 0.5, -0.1, 1.0);
        vec3 l = vec3(0.1, 0.3, 0.4) + vec3(5.0, 2.5, 3.0) * f;
        cl = cl * l + smoothstep(2.5, 0.0, rz) * 0.6 * l;
        d += min(rz, 1.0);
    }

    gl_FragColor = vec4(cl, 1.0);
}`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vs, fs) {
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function initWebGL() {
  const cvs = canvas.value;
  if (!cvs) return;

  gl = cvs.getContext('webgl', { antialias: false });
  if (!gl) {
    gl = cvs.getContext('experimental-webgl', { antialias: false });
  }
  if (!gl) {
    console.warn('WebGL not supported, falling back to static background');
    return;
  }

  const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vs || !fs) return;

  const program = createProgram(gl, vs, fs);
  if (!program) return;

  gl.useProgram(program);

  // Fullscreen quad
  const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  const aPosition = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

  return {
    program,
    uResolution: gl.getUniformLocation(program, 'u_resolution'),
    uTime: gl.getUniformLocation(program, 'u_time'),
  };
}

function resize() {
  const cvs = canvas.value;
  if (!cvs || !gl) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap for perf
  const w = window.innerWidth;
  const h = window.innerHeight;
  cvs.width = w * dpr;
  cvs.height = h * dpr;
  cvs.style.width = w + 'px';
  cvs.style.height = h + 'px';
  gl.viewport(0, 0, cvs.width, cvs.height);
}

function render(uniforms) {
  if (!gl || !uniforms) return;
  gl.uniform2f(uniforms.uResolution, canvas.value.width, canvas.value.height);
  gl.uniform1f(uniforms.uTime, (performance.now() - startTime) / 1000.0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  animFrameId = requestAnimationFrame(() => render(uniforms));
}

onMounted(() => {
  console.log('[RiseBackground] Mounting...');
  resize();
  const uniforms = initWebGL();
  if (uniforms) {
    console.log('[RiseBackground] WebGL initialized, starting render loop');
    startTime = performance.now();
    animFrameId = requestAnimationFrame(() => render(uniforms));
  } else {
    console.warn('[RiseBackground] WebGL init failed - uniforms:', uniforms);
  }
  window.addEventListener('resize', resize);
});

onUnmounted(() => {
  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId);
  }
  window.removeEventListener('resize', resize);
  if (gl) {
    gl.deleteProgram(gl.getParameter(gl.CURRENT_PROGRAM));
  }
});
</script>

<style>
.rise-bg-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  pointer-events: none;
}
</style>
