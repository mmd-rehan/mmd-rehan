import { STRAND_FORMS_GLSL } from './strandForms'

/**
 * GLSL for the filament strands — the "neurons".
 *
 * Geometry is a flat ribbon strip per strand (2 verts per lengthwise sample).
 * The centre-line is computed in the vertex shader by `strandPoint`, which
 * morphs each strand across head → cable → sphere → vortex by uT. We sample it
 * at u±eps for a tangent and offset each edge vert perpendicular to that
 * tangent in view space, so the ribbon always faces the camera.
 *
 * aStrand (0..1 id), aU (0 root .. 1 tip), aSide (-1 / +1 ribbon edge),
 * aRoot / aTipHead give the head-phase endpoints. uGrow reveals each strand
 * from its root; uReveal is the global fade.
 */

export const filamentVertexShader = /* glsl */ `
  precision highp float;

  attribute float aStrand;
  attribute float aU;
  attribute float aSide;
  attribute vec3 aRoot;
  attribute vec3 aTipHead;

  uniform float uGrow;
  uniform float uT;
  uniform float uTime;
  uniform float uReveal;
  uniform float uWidth;

  varying float vU;
  varying float vTip;
  varying float vAlpha;
  varying float vEnergy;

  ${STRAND_FORMS_GLSL}

  void main() {
    float g = clamp((uGrow - aStrand * 0.35) / 0.65, 0.0, 1.0);
    g = g * g * (3.0 - 2.0 * g);
    float revealed = smoothstep(aU - 0.14, aU - 0.01, g);

    float eps = 0.014;
    vec3 c0 = strandPoint(aRoot, aTipHead, max(aU - eps, 0.0), aStrand, uTime, uT);
    vec3 c1 = strandPoint(aRoot, aTipHead, min(aU + eps, 1.0), aStrand, uTime, uT);
    vec3 c = mix(c0, c1, 0.5);
    c = mix(aRoot, c, revealed);

    vec4 mv0 = modelViewMatrix * vec4(c0, 1.0);
    vec4 mv1 = modelViewMatrix * vec4(c1, 1.0);
    vec4 mv = modelViewMatrix * vec4(c, 1.0);

    vec3 tang = normalize(mv1.xyz - mv0.xyz + vec3(0.0001));
    vec3 viewDir = normalize(-mv.xyz);
    vec3 side = normalize(cross(tang, viewDir));

    float width = uWidth * (0.35 + 0.65 * (1.0 - aU));
    mv.xyz += side * aSide * width;

    gl_Position = projectionMatrix * mv;

    vU = aU;
    vTip = smoothstep(0.7, 1.0, aU);
    vAlpha = revealed * uReveal;
    vEnergy = uT;
  }
`

export const filamentFragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3 uStrand;
  uniform vec3 uYellow;
  uniform vec3 uAmber;
  uniform vec3 uHot;
  uniform vec3 uCool;

  varying float vU;
  varying float vTip;
  varying float vAlpha;
  varying float vEnergy;

  void main() {
    if (vAlpha < 0.02) discard;

    // A defined fibre — a muted stone-grey body so dense overlaps read as
    // structure, not a white haze. Tips warm to yellow / amber — sparingly, so
    // the sphere stays cream-white and only the vortex arms really glow.
    vec3 col = mix(uStrand, vec3(0.66, 0.67, 0.64), 0.6);
    float warmAmt = mix(1.0, 0.45, smoothstep(0.62, 0.72, vEnergy) * (1.0 - smoothstep(0.82, 0.9, vEnergy)));
    col = mix(col, uYellow, smoothstep(0.60, 0.9, vTip) * warmAmt);
    col = mix(col, uAmber, smoothstep(0.9, 1.0, vTip) * warmAmt);

    // a whisper of cool energy only while the cable is forming
    float coolBeat = smoothstep(0.48, 0.58, vEnergy) * (1.0 - smoothstep(0.58, 0.68, vEnergy));
    col = mix(col, uCool, coolBeat * 0.16);

    // a little hot bleed on the innermost vortex strands (the CoreGlow sprite
    // does most of the blazing-centre work)
    float coreGlow = (1.0 - smoothstep(0.0, 0.16, vU)) * smoothstep(0.82, 0.94, vEnergy);
    col = mix(col, uHot, coreGlow * 0.8);

    // denser bodies once the strands are packed into the sphere / vortex
    float density = mix(0.15, 0.26, smoothstep(0.60, 0.80, vEnergy));
    float bodyA = density * smoothstep(0.03, 0.26, vU) * (1.0 - smoothstep(0.85, 1.0, vU) * 0.4);
    float a = mix(bodyA, 0.55, vTip) + coreGlow * 0.4;
    float over = 1.0 + vTip * 0.4 + coreGlow * 1.8;

    gl_FragColor = vec4(col * over, clamp(a, 0.0, 1.0) * vAlpha);
  }
`
