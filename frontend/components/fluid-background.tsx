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
  float t = u_time * 0.08;

  // Organic flowing noise
  vec2 q = vec2(
    fbm(uv * 2.0 + vec2(t, t * 0.7)),
    fbm(uv * 2.0 + vec2(t * 1.3, -t * 0.5))
  );

  vec2 r = vec2(
    fbm(uv * 2.0 + q + vec2(t * 0.4, t * 0.2) + vec2(1.7, 9.2)),
    fbm(uv * 2.0 + q + vec2(t * 0.3, t * 0.6) + vec2(8.3, 2.8))
  );

  float f = fbm(uv * 2.0 + r * 1.5);

  // Color palette: deep purple, magenta, cyan
  vec3 purple = vec3(0.298, 0.114, 0.584);   // #4C1D95
  vec3 magenta = vec3(0.745, 0.094, 0.365);  // #BE185D
  vec3 cyan = vec3(0.055, 0.455, 0.565);     // #0E7490
  vec3 darkBg = vec3(0.039, 0.039, 0.059);   // #0A0A0F

  // Mix colors based on noise
  vec3 color = mix(purple, magenta, clamp(f * 2.0 + 0.5, 0.0, 1.0));
  color = mix(color, cyan, clamp(q.x * 2.0 + 0.3, 0.0, 1.0));
  color = mix(color, darkBg, 0.92); // Very low opacity overlay

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
