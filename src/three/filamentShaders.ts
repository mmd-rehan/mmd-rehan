/**
 * GLSL for the filament tubes — the "neurons".
 *
 * Geometry is a set of thin tubes swept along splines, merged into one buffer.
 * Per-vertex `aU` (0 root .. 1 tip) and `aStrand` (0..1 id) drive the reveal:
 * each strand grows from its root outward as `uGrow` rises, with a per-strand
 * stagger, and sways with flow noise. NORMAL blended so overlaps build to a soft
 * translucent white rather than blowing out; only the last stretch near the tip
 * takes ember colour and a little over-brightness for the bloom to find.
 */

export const filamentVertexShader = /* glsl */ `
  precision highp float;

  attribute float aU;
  attribute float aStrand;
  attribute vec3 aRoot;

  uniform float uGrow;
  uniform float uTime;
  uniform float uReveal;

  varying float vTip;
  varying float vAlpha;
  varying float vU;

  vec3 flow(vec3 p, float t) {
    float a = sin(p.y * 2.0 + t) + cos(p.z * 1.6 - t * 0.7);
    float b = sin(p.z * 1.8 - t * 1.1) + cos(p.x * 2.2 + t * 0.5);
    float c = sin(p.x * 1.7 + t * 0.9) + cos(p.y * 1.9 - t * 0.6);
    return vec3(a, b, c);
  }

  void main() {
    float g = clamp((uGrow - aStrand * 0.4) / 0.6, 0.0, 1.0);
    g = g * g * (3.0 - 2.0 * g);

    float revealed = smoothstep(aU - 0.16, aU - 0.02, g);

    // Collapse unrevealed sections onto the root, and thin the tube toward the
    // tip by pulling vertices toward the strand's local centre-ish (aRoot dir).
    vec3 p = mix(aRoot, position, revealed);

    float swayAmt = aU * aU * 0.11;
    p += flow(position + vec3(aStrand * 29.0), uTime * 0.3) * swayAmt;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    vTip = smoothstep(0.78, 1.0, aU);
    float front = smoothstep(0.07, 0.0, abs(aU - g)) * (1.0 - step(0.985, g)) * 0.3;
    vTip = clamp(vTip + front, 0.0, 1.0);
    vU = aU;
    vAlpha = revealed * uReveal;
  }
`

export const filamentFragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3 uWhite;
  uniform vec3 uEmber;
  uniform vec3 uHot;

  varying float vTip;
  varying float vAlpha;
  varying float vU;

  void main() {
    if (vAlpha < 0.02) discard;

    vec3 col = uWhite;
    col = mix(col, uEmber, smoothstep(0.35, 0.8, vTip));
    col = mix(col, uHot, smoothstep(0.8, 1.0, vTip));

    // Translucent body, faded hard over the first third so the origin stays
    // diffuse instead of a hot white knot; denser + over-bright at the tip so
    // bloom reads it as a glowing nerve ending.
    float bodyA = 0.3 * smoothstep(0.05, 0.38, vU) * (1.0 - smoothstep(0.82, 1.0, vU) * 0.5);
    float a = mix(bodyA, 0.95, vTip);
    float over = 1.0 + vTip * 1.5;

    gl_FragColor = vec4(col * over, a * vAlpha);
  }
`
