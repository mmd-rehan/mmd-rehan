import { DISSOLVE_GLSL } from './dissolve'

/**
 * The photoreal head. The GLB's baked albedo, gently graded and lit like a soft
 * studio portrait to sit on the pale stone environment — warm key, cool fill,
 * high ambient. A sweep front (uDissolve, shared with the particle field via
 * dissolveField) eats the mesh away: fragments behind it are discarded,
 * fragments just ahead flare amber; surviving skin resolves into cool contour
 * isolines.
 */

export const headVertexShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  varying vec3 vLocalPos;
  varying vec3 vLocalNormal;
  varying vec3 vNormalV;

  void main() {
    vUv = uv;
    vLocalPos = position;
    vLocalNormal = normalize(normal);
    vNormalV = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const headFragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D uMap;
  uniform float uHasMap;
  uniform vec3 uFlat;
  uniform float uDissolve;
  uniform float uContour;
  uniform float uTurn;
  uniform float uTime;
  uniform vec3 uAmber;
  uniform vec3 uYellow;
  uniform vec3 uCool;
  uniform vec3 uStrand;

  varying vec2 vUv;
  varying vec3 vLocalPos;
  varying vec3 vLocalNormal;
  varying vec3 vNormalV;

  ${DISSOLVE_GLSL}

  /**
   * The machined scalp. As the head turns away, the back of the skull resolves
   * from skin into a panelled machine surface — seams, sockets where the fibre
   * conduits exit, and a cool charge running through them. Reads as designed
   * hardware rather than a bare patch of head.
   */
  vec3 machineScalp(vec3 base, vec3 p, vec3 n, float amount, out float emissive) {
    emissive = 0.0;
    if (amount < 0.001) return base;

    // Fine cylindrical shell coords around the skull.
    vec2 g = vec2(atan(p.x, -p.z) * 5.5, p.y * 7.0);
    vec2 cell = fract(g) - 0.5;
    vec2 id = floor(g);

    // Hairline panel seams — etched, not moulded.
    float seam = smoothstep(0.90, 1.0, max(abs(cell.x), abs(cell.y)) * 2.0);

    // Occasional small port where a conduit leaves the scalp.
    float rnd = fract(sin(dot(id, vec2(41.3, 289.1))) * 43758.5453);
    float has = step(0.86, rnd);
    float d = length(cell);
    float bore = smoothstep(0.11, 0.07, d) * has;
    float ring = (smoothstep(0.15, 0.12, d) - smoothstep(0.11, 0.08, d)) * has;
    float pulse = 0.55 + 0.45 * sin(uTime * 1.6 - p.y * 4.0 + rnd * 6.28);

    // Brushed alloy on the same key light as the skin, dark enough that the
    // skull keeps its form against the pale ground.
    float shade = max(dot(n, normalize(vec3(0.45, 0.5, 0.85))), 0.0);
    vec3 metal = mix(vec3(0.16, 0.17, 0.18), vec3(0.66, 0.67, 0.66), shade);
    metal = mix(metal, metal * 0.6, seam);
    metal = mix(metal, vec3(0.09, 0.10, 0.11), bore);
    metal = mix(metal, mix(metal, uCool, 0.75), ring * pulse);

    emissive = ring * pulse * amount;
    // Keep a memory of the skin under the alloy so it still reads as him.
    return mix(base, mix(base, metal, 0.82), amount);
  }

  void main() {
    float field = dissolveField(vLocalPos);
    float edge = uDissolve - field;
    if (edge > 0.0) discard;

    vec3 albedo = uHasMap > 0.5 ? texture2D(uMap, vUv).rgb : uFlat;
    // gentle grade — soft, no pow (driver-safe)
    albedo = albedo * (albedo * 0.22 + 0.82);
    float l = dot(albedo, vec3(0.299, 0.587, 0.114));
    albedo = mix(vec3(l), albedo, 1.05);
    // de-red the baked beard / neck AO
    float shadow = 1.0 - smoothstep(0.12, 0.44, l);
    albedo = mix(albedo, vec3(l) * vec3(0.96, 0.98, 1.02), shadow * 0.38);

    vec3 n = normalize(vNormalV);
    float key = max(dot(n, normalize(vec3(0.45, 0.5, 0.85))), 0.0);
    float fill = max(dot(n, normalize(vec3(-0.5, -0.15, 0.35))), 0.0);
    vec3 light = vec3(0.70) + vec3(1.0, 0.96, 0.90) * key * 0.52 + uCool * fill * 0.16;
    vec3 lit = albedo * light;

    // The back of the skull machines itself as the head turns away — hides the
    // bare scalp and sets up the conduits the fibres erupt from.
    float backness = smoothstep(0.15, -0.45, vLocalNormal.z);
    float machined = backness * smoothstep(0.15, 0.7, uTurn);
    float mEmissive = 0.0;
    lit = machineScalp(lit, vLocalPos, n, machined, mEmissive);

    // amber rim catching the silhouette
    float rim = pow(1.0 - clamp(dot(n, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 3.0);
    lit += uAmber * rim * 0.26;
    lit += uCool * mEmissive * 0.45;

    // cool-white contour isolines resolve over the surviving skin
    float ff = vLocalPos.y * 6.5 + sin(vLocalPos.x * 3.4) * 0.6 + vLocalPos.z * 2.2;
    float iso = abs(fract(ff - uTime * 0.03) - 0.5) * 2.0;
    float line = smoothstep(0.80, 0.99, iso) * uContour;
    lit = mix(lit, mix(uStrand, uCool, 0.45), line * 0.9);

    // amber burn just ahead of the eat line — a thin bright edge
    float glow = smoothstep(-0.035, 0.004, edge);
    lit = mix(lit, uYellow, glow * 0.55);
    lit += uAmber * glow * 0.5;

    gl_FragColor = vec4(lit, 1.0);
  }
`
