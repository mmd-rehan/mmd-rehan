import { STRAND_FORMS_GLSL } from './strandForms'

/**
 * GLSL for the filament strands — the white cords.
 *
 * The reference reads as thick, OPAQUE macramé-style cord: each strand is a
 * solid round rope with a lit top, shaded flanks and a soft twist, so a bundle
 * of them shows every individual cord instead of blending into haze. That is
 * what this shader draws — not translucent hairs.
 *
 * Geometry is a flat ribbon strip per strand (2 verts per lengthwise sample).
 * The centre-line is computed by `strandPoint`, which morphs each strand across
 * head → cable → sphere → vortex by uT. We sample it at u±eps for a tangent and
 * offset each edge vert perpendicular to it in view space, so the ribbon faces
 * the camera; `vSide` then lets the fragment shader shade it as a cylinder.
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
  uniform mat4 uHeadMat;

  varying float vU;
  varying float vTip;
  varying float vAlpha;
  varying float vEnergy;
  varying float vFront;
  varying float vSide;
  varying float vTone;

  ${STRAND_FORMS_GLSL}

  void main() {
    float g = clamp((uGrow - aStrand * 0.35) / 0.65, 0.0, 1.0);
    g = g * g * (3.0 - 2.0 * g);
    float revealed = smoothstep(aU - 0.14, aU - 0.01, g);

    // The growing end of each cord is incandescent — the reference's glowing
    // fibre ends. Dies away once the cord has finished extending.
    vFront = smoothstep(0.045, 0.0, abs(aU - g)) * (1.0 - smoothstep(0.85, 1.0, g));

    float eps = 0.014;
    vec3 c0 = strandPoint(aRoot, aTipHead, max(aU - eps, 0.0), aStrand, uTime, uT, uHeadMat);
    vec3 c1 = strandPoint(aRoot, aTipHead, min(aU + eps, 1.0), aStrand, uTime, uT, uHeadMat);
    vec3 c = mix(c0, c1, 0.5);
    // unrevealed length collapses onto the root, in the head's current frame
    vec3 rootW = (uHeadMat * vec4(aRoot, 1.0)).xyz;
    c = mix(rootW, c, revealed);

    vec4 mv0 = modelViewMatrix * vec4(c0, 1.0);
    vec4 mv1 = modelViewMatrix * vec4(c1, 1.0);
    vec4 mv = modelViewMatrix * vec4(c, 1.0);

    vec3 tang = normalize(mv1.xyz - mv0.xyz + vec3(0.0001));
    vec3 viewDir = normalize(-mv.xyz);

    // Camera-facing ribbon. When a strand points straight at the camera the
    // cross product collapses and the quad explodes into a flat sheet — guard
    // it with a stable fallback and fade the strand out as it degenerates.
    vec3 sideRaw = cross(tang, viewDir);
    float sideLen = length(sideRaw);
    vec3 side = sideLen > 1e-3
      ? sideRaw / sideLen
      : normalize(cross(tang, vec3(0.0, 1.0, 0.0)) + vec3(0.001));
    // Near-edge-on cords are squeezed to nothing by scaling the WIDTH, not by
    // fading alpha — the material is opaque, so a fade would pop.
    float facing = smoothstep(0.06, 0.30, sideLen);

    // Cords keep most of their girth to the tip — they are rope, not hair.
    float width = uWidth * (0.72 + 0.28 * (1.0 - aU)) * facing;
    mv.xyz += side * aSide * width;

    gl_Position = projectionMatrix * mv;

    vU = aU;
    vSide = aSide;
    vTone = fract(sin(aStrand * 91.37) * 43758.5453);
    vTip = smoothstep(0.7, 1.0, aU);
    // Reveal only — a clean growing tip. Mixing the facing term in here made
    // whole segments blink out and read as floating cut cylinders.
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
  varying float vFront;
  varying float vSide;
  varying float vTone;

  void main() {
    if (vAlpha < 0.45) discard;

    // ---- Cylindrical cord ------------------------------------------------
    // vSide runs -1..1 across the ribbon. Treating it as a cylinder cross
    // section gives each cord a lit crown and shaded flanks — the single thing
    // that makes a bundle read as separate ropes instead of a white smear.
    float s = clamp(vSide, -1.0, 1.0);
    float r = sqrt(max(0.0, 1.0 - s * s));
    if (r < 0.12) discard;                       // clean round edge

    // surface normal in the ribbon's frame, lit from the upper left
    vec3 nrm = normalize(vec3(s, 0.0, r));
    vec3 L = normalize(vec3(-0.45, 0.0, 0.89));
    float diff = max(dot(nrm, L), 0.0);
    float spec = pow(diff, 12.0);

    // Twist: a soft helical banding along the cord, so it reads as spun yarn.
    float twist = 0.5 + 0.5 * sin(vU * 210.0 + s * 2.0 + vTone * 6.28);
    float shade = 0.30 + 0.62 * diff + 0.16 * spec;
    shade *= 0.93 + 0.07 * twist;
    // ambient occlusion into the flanks so neighbours separate
    shade *= 0.62 + 0.38 * r;

    vec3 cord = uStrand * (0.90 + 0.16 * vTone);
    vec3 col = cord * shade;
    // cool bounce in the shadowed flank keeps it sitting in the palette
    col += uCool * (1.0 - diff) * 0.05;

    // Every cord ends in a glowing ferrule — the orange beads studding the
    // bloom in reference frames 033 / 039, and the lit fibre ends in 026.
    // Tight (last ~10%) so it reads as a capped end, not a warm half.
    float bead = smoothstep(0.88, 0.99, vU);
    col = mix(col, uYellow * (0.85 + 0.3 * diff), bead * 0.85);
    col = mix(col, uAmber * (0.9 + 0.3 * diff), smoothstep(0.94, 1.0, vU) * 0.8);

    // a whisper of cool energy only while the cable is forming
    float coolBeat = smoothstep(0.48, 0.58, vEnergy) * (1.0 - smoothstep(0.58, 0.68, vEnergy));
    col = mix(col, uCool, coolBeat * 0.12);

    // Radial heat: the cords are incandescent where they meet the core and cool
    // to white toward the rim — the reference's red-orange centre bleeding out
    // along the inner third of each cord.
    float inCore = smoothstep(0.62, 0.76, vEnergy);
    // Very tight falloff — the reference core is a small orange-red knot where
    // the cords converge, roughly a tenth of the bloom, not a white lobe.
    float heat = (1.0 - smoothstep(0.01, 0.14, vU)) * inCore;
    // Incandescent, so NOT diffuse-shaded — directional shading here made the
    // core read as a lit crescent instead of an even knot of heat.
    col = mix(col, uAmber, heat * 0.92);
    col = mix(col, uYellow, pow(heat, 2.2) * 0.8);
    float coreGlow = pow(heat, 4.0);
    col = mix(col, uHot, coreGlow * 0.85);

    // Incandescent growing end — lights the cord from inside.
    col = mix(col, uYellow, vFront * 0.6);
    col = mix(col, uAmber, vFront * vFront * 0.5);

    // Keep well clear of clipping: over-brightening the core is what turned it
    // into a solid white blob that ate a crescent out of the disc.
    float over = 1.0 + heat * 0.25 + coreGlow * 0.8 + vFront * 0.5 + bead * 0.45;
    gl_FragColor = vec4(col * over, 1.0);
  }
`
