import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FINALE_CENTER } from './strandForms'
import { HOT_CORE_RGB, YELLOW_RGB, AMBER_RGB } from '../theme'

/**
 * The blazing centre of the sphere / vortex — a camera-facing additive glow at
 * the finale's centre. Fades in as the sphere coils (t≈0.6) and blooms for the
 * vortex.
 */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0))
  return t * t * (3 - 2 * t)
}

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragment = /* glsl */ `
  precision highp float;
  uniform float uOpacity;
  uniform vec3 uHot;
  uniform vec3 uWarm;
  uniform vec3 uRim;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    if (d > 1.0) discard;
    float core = pow(1.0 - clamp(d / 0.28, 0.0, 1.0), 2.0);
    float halo = pow(1.0 - d, 2.2);
    vec3 col = uHot * core + uWarm * halo * 0.7 + uRim * pow(halo, 3.0) * 0.4;
    float a = (core * 1.3 + halo * 0.5) * uOpacity;
    gl_FragColor = vec4(col, a);
  }
`

const vec = (c: { r: number; g: number; b: number }) => new THREE.Vector3(c.r, c.g, c.b)

export function CoreGlow({ progress }: { progress: MutableRefObject<number> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const meshRef = useRef<THREE.Mesh>(null)

  const uniforms = useMemo(
    () => ({
      uOpacity: { value: 0 },
      uHot: { value: vec(HOT_CORE_RGB) },
      uWarm: { value: vec(YELLOW_RGB) },
      uRim: { value: vec(AMBER_RGB) },
    }),
    [],
  )

  useFrame(({ camera }) => {
    const t = progress.current
    const appear = smoothstep(0.6, 0.72, t)
    const bloom = 0.45 + 0.55 * smoothstep(0.75, 0.92, t)
    const fadeOut = 1 - smoothstep(0.985, 1, t)
    if (matRef.current) matRef.current.uniforms.uOpacity.value = appear * bloom * fadeOut
    if (meshRef.current) meshRef.current.quaternion.copy(camera.quaternion)
  })

  return (
    <mesh ref={meshRef} position={FINALE_CENTER} renderOrder={4} frustumCulled={false}>
      <planeGeometry args={[3.4, 3.4]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertex}
        fragmentShader={fragment}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}
