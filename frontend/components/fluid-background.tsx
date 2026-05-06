'use client'

import { useEffect, useRef } from 'react'

const VERTEX_SHADER = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

// Simplex 2D noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Fractional Brownian Motion
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 5; i++) {
    value += amplitude * snoise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float t = u_time * 0.06;

  // Domain-warped fbm for organic, cloud-like flow
  vec2 q = vec2(
    fbm(uv * 1.2 + vec2(t * 0.5, t * 0.3)),
    fbm(uv * 1.2 + vec2(-t * 0.2, t * 0.4))
  );

  vec2 r = vec2(
    fbm(uv * 1.5 + q + vec2(t * 0.15, t * 0.1) + vec2(3.1, 7.4)),
    fbm(uv * 1.5 + q + vec2(t * 0.12, t * 0.18) + vec2(5.7, 1.3))
  );

  float f = fbm(uv * 1.8 + r * 0.8);

  // ---- Google-style restrained cool palette ----
  // Base: deep blue-black (#080A12)
  vec3 bg = vec3(0.031, 0.039, 0.071);

  // Cool indigo cloud core (#1a1f4b at very low intensity)
  vec3 indigo = vec3(0.102, 0.122, 0.294);

  // Steel cyan drift (#0d1f2d)
  vec3 steel = vec3(0.051, 0.122, 0.176);

  // Ice highlight — barely visible, only at peaks (#c8e0f0)
  vec3 ice = vec3(0.784, 0.878, 0.941);

  // Build color: start from bg, let noise push it toward indigo/steel/ice
  // Most of the canvas stays near bg; only high-noise areas glow subtly.
  vec3 color = bg;

  // Soft indigo layer
  float indigoMask = smoothstep(0.35, 0.65, f);
  color = mix(color, indigo, indigoMask * 0.18);

  // Steel cyan layer, offset by secondary warp
  float steelMask = smoothstep(0.40, 0.70, r.x * 0.5 + 0.5);
  color = mix(color, steel, steelMask * 0.12);

  // Ice highlight — only the very brightest peaks
  float iceMask = smoothstep(0.58, 0.82, f);
  color = mix(color, ice, iceMask * 0.06);

  // Vignette to keep edges dark and focus attention center
  vec2 center = uv - 0.5;
  float vignette = 1.0 - dot(center, center) * 0.6;
  color *= clamp(vignette, 0.0, 1.0);

  gl_FragColor = vec4(color, 1.0);
}
`

export default function FluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', { alpha: false, antialias: false })
    if (!gl) return

    // Compile shaders
    function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type)!
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
    if (!vs || !fs) return

    const program = gl.createProgram()!
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program))
      return
    }

    gl.useProgram(program)

    // Full-screen quad
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    const positionLoc = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(positionLoc)
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)

    const resolutionLoc = gl.getUniformLocation(program, 'u_resolution')
    const timeLoc = gl.getUniformLocation(program, 'u_time')

    let animationId: number
    let startTime = performance.now()

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 1.5)
      canvas!.width = window.innerWidth * dpr
      canvas!.height = window.innerHeight * dpr
      gl!.viewport(0, 0, canvas!.width, canvas!.height)
    }

    function render() {
      const elapsed = (performance.now() - startTime) / 1000
      gl!.uniform2f(resolutionLoc, canvas!.width, canvas!.height)
      gl!.uniform1f(timeLoc, elapsed)
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
      animationId = requestAnimationFrame(render)
    }

    resize()
    window.addEventListener('resize', resize)
    animationId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buffer)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ width: '100%', height: '100%' }}
    />
  )
}
