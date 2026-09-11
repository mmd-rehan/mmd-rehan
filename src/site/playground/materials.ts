import * as THREE from 'three'

/**
 * The desk palette. Values are taken straight from the reference playground so
 * the two scenes light and read identically.
 */
export const PALETTE = {
  blue: 0x193ee8,
  ink: 0x19252d,
  paper: 0xf8f9f5,
  pale: 0xdbe6ff,
  white: 0xfcfcfa,
  chrome: 0xd8e0e5,
  coral: 0xff7c52,
  glass: 0x8fc8ff,
  glassGlow: 0x407dff,
  skyLight: 0xf5f8ff,
  groundLight: 0xb6beb7,
  fillLight: 0xa5b9ff,
  gridMajor: 0xc4cdd9,
  gridMinor: 0xdfe4e6,
  deskOutline: 0x9bb0e8,
  floorShadow: 0x687284,
  ledOff: 0x6b8fff,
} as const

export type Palette = {
  blue: THREE.MeshPhysicalMaterial
  white: THREE.MeshPhysicalMaterial
  pale: THREE.MeshPhysicalMaterial
  ink: THREE.MeshStandardMaterial
  chrome: THREE.MeshStandardMaterial
  coral: THREE.MeshStandardMaterial
  light: THREE.MeshStandardMaterial
}

export function createMaterials(): Palette {
  return {
    blue: new THREE.MeshPhysicalMaterial({
      color: PALETTE.blue,
      roughness: 0.23,
      metalness: 0.22,
      clearcoat: 0.8,
      clearcoatRoughness: 0.18,
    }),
    white: new THREE.MeshPhysicalMaterial({
      color: PALETTE.white,
      roughness: 0.4,
      metalness: 0.08,
      clearcoat: 0.4,
    }),
    pale: new THREE.MeshPhysicalMaterial({
      color: PALETTE.pale,
      roughness: 0.35,
      metalness: 0.18,
    }),
    ink: new THREE.MeshStandardMaterial({
      color: PALETTE.ink,
      roughness: 0.33,
      metalness: 0.3,
    }),
    chrome: new THREE.MeshStandardMaterial({
      color: PALETTE.chrome,
      roughness: 0.2,
      metalness: 0.88,
    }),
    coral: new THREE.MeshStandardMaterial({
      color: PALETTE.coral,
      roughness: 0.38,
      metalness: 0.1,
    }),
    light: new THREE.MeshStandardMaterial({
      color: PALETTE.glass,
      emissive: PALETTE.glassGlow,
      emissiveIntensity: 0.7,
      roughness: 0.2,
    }),
  }
}
