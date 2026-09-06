import { DISSOLVE_GLSL } from './dissolve'

/**
 * The photoreal head. The GLB's baked albedo texture, lifted by a soft warm key
 * + an ember rim so it sits on the charcoal stage instead of a cream one. A
 * sweep front (uDissolve, shared with the particle field via dissolveField)
 * eats the mesh away — fragments behind the front are discarded, fragments just
 * ahead of it flare ember-hot; surviving skin resolves into contour isolines.
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
  uniform vec3 uEmber;
  uniform vec3 uEmberHot;
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
    // Grade the flat scan texture into a studio portrait on charcoal: a soft
    // contrast curve (no pow — keep it driver-safe), a little saturation, warm.
    albedo = albedo * (albedo * 0.45 + 0.62);
    float l = dot(albedo, vec3(0.299, 0.587, 0.114));
    albedo = mix(vec3(l), albedo, 1.14);
    albedo *= vec3(1.10, 1.0, 0.90);
    // pull the reddish baked AO out of the beard / neck shadows
    float shadow = 1.0 - smoothstep(0.12, 0.46, l);
    albedo = mix(albedo, vec3(l) * vec3(0.94, 0.97, 1.02), shadow * 0.45);

    vec3 n = normalize(vNormalV);
    float key = max(dot(n, normalize(vec3(0.40, 0.42, 0.90))), 0.0);
    float up = 0.5 + 0.5 * n.y;
    vec3 lit = albedo * (0.78 + 0.5 * key + 0.12 * up);

    // ember back-rim — the brand colour catching the edge of the form
    float rim = pow(1.0 - clamp(dot(n, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 3.0);
    lit += uEmber * rim * 0.38;

    // topographic isolines resolve over the surviving skin during the flip
    float ff = vLocalPos.y * 6.5 + sin(vLocalPos.x * 3.4) * 0.6 + vLocalPos.z * 2.2;
    float iso = abs(fract(ff - uTime * 0.03) - 0.5) * 2.0;
    float line = smoothstep(0.80, 0.99, iso) * uContour;
    lit = mix(lit, uStrand * (0.45 + 0.7 * key), line);

    // ember burn just ahead of the eat line — a thin bright edge, not a wash
    float glow = smoothstep(-0.035, 0.004, edge);
    lit = mix(lit, uEmberHot, glow * 0.72);
    lit += uEmber * glow * 0.35;

    gl_FragColor = vec4(lit, 1.0);
  }
`
