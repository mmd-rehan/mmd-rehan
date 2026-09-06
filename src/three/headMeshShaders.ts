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
  varying vec3 vNormalV;

  void main() {
    vUv = uv;
    vLocalPos = position;
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
  uniform float uTime;
  uniform vec3 uAmber;
  uniform vec3 uYellow;
  uniform vec3 uCool;
  uniform vec3 uStrand;

  varying vec2 vUv;
  varying vec3 vLocalPos;
  varying vec3 vNormalV;

  ${DISSOLVE_GLSL}

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

    // amber rim catching the silhouette
    float rim = pow(1.0 - clamp(dot(n, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 3.0);
    lit += uAmber * rim * 0.26;

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
