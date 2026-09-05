/**
 * GLSL for the particle field.
 *
 * The portrait points morph toward the nerve cloud by uBlend (per-particle
 * stagger keeps structure on screen). Three explicit phase uniforms shape the
 * beats:
 *   uContour  — skin particles hold the surface and resolve into warm-white
 *               topographic isolines; dark hair / beard particles fly as debris.
 *   uBlend    — position morph portrait -> nerve cloud (driven by the dissolve
 *               beat, so the face stays coherent while the head tilts back).
 *   uSettle   — fade the particles down to faint drifting embers so the
 *               filaments own the frame at the end.
 */

export const particleVertexShader = /* glsl */ `
  precision highp float;

  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute float aSeed;
  attribute vec3 aColor;

  uniform float uBlend;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uScale;
  uniform float uTipGlow;
  uniform float uContour;
  uniform float uPortrait;
  uniform float uSettle;
  uniform float uPortraitReveal;

  varying float vGlow;
  varying vec3 vColor;
  varying float vContourLine;
  varying float vHair;
  varying float vReveal;

  float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

  vec3 flow(vec3 p, float t) {
    float a = sin(p.y * 3.0 + t) + cos(p.z * 2.3 - t * 0.7);
    float b = sin(p.z * 2.7 - t * 1.1) + cos(p.x * 3.1 + t * 0.5);
    float c = sin(p.x * 2.5 + t * 0.9) + cos(p.y * 2.9 - t * 0.6);
    return vec3(a, b, c);
  }

  void main() {
    // Cull almost every particle once the filaments own the frame — a fade
    // alone can't beat the overlap of a dense cloud, so we keep only a sparse
    // remnant of drifting debris.
    float keep = mix(1.0, 0.04, smoothstep(0.35, 0.95, uSettle));
    if (aSeed > keep) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      return;
    }

    float spread = 0.5;
    float startT = aSeed * spread;
    float bl = smoothstep(0.0, 1.0, clamp((uBlend - startT) / (1.0 - spread), 0.0, 1.0));
    vec3 base = mix(aFrom, aTo, bl);

    float hair = 1.0 - smoothstep(0.16, 0.42, luma(aColor));
    vHair = hair;

    // Scatter peaks mid-morph. Skin particles barely move during the contour
    // beat (they ARE the lit shell); hair particles drift as debris.
    float scatter = sin(bl * 3.14159265);
    float skinLock = uContour * (1.0 - hair);
    float hairDrift = uContour * hair * smoothstep(0.15, 1.1, length(base.xy));
    float move = max(scatter * mix(1.0, 0.12, skinLock), hairDrift * 0.5);

    vec3 tang = normalize(vec3(-base.z, base.x * 0.3, base.x) + vec3(0.0001));
    vec3 seededDir = normalize(vec3(
      sin(aSeed * 12.9 + base.y * 3.0),
      cos(aSeed * 7.7 + base.z * 2.3),
      sin(aSeed * 5.3 + base.x * 4.1)
    ));
    vec3 churn = flow(base * 1.5 + vec3(aSeed * 6.2831), uTime * 0.8);
    // Debris rides the same rightward sweep as the filaments so the cloud and
    // the strands move together instead of pulling apart.
    vec3 sweep = normalize(vec3(0.82, 0.34, 0.12));
    vec3 drift = sweep + vec3((aSeed - 0.5) * 0.5, (aSeed - 0.3) * 0.4, 0.0);

    float mag = move * (0.4 + aSeed * 0.6);
    vec3 pos = base
      + drift * mag * 0.55
      + tang * mag * 0.22
      + seededDir * mag * 0.18
      + churn * move * 0.24;

    pos += flow(base * 1.15 + vec3(aSeed * 6.2831), uTime * 0.22) * 0.016;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float sizeVar = (0.7 + aSeed * 0.6) * (1.0 + scatter * 0.7);
    sizeVar *= mix(1.0, 0.55, uContour * (1.0 - hair));
    sizeVar *= mix(1.0, 0.4, uSettle);
    float px = uSize * sizeVar * uPixelRatio * (uScale / max(-mv.z, 0.001));
    gl_PointSize = clamp(px, 1.0, 90.0);

    // Topographic isolines: a smooth height-ish field (mostly Y, undulating
    // with X and Z) sliced into contours, so the lines wrap the face like a
    // relief map instead of flat venetian blinds. Drifts slowly = "scanning".
    float field = base.y * 6.5 + sin(base.x * 3.4) * 0.6 + base.z * 2.2 - uTime * 0.05;
    float iso = abs(fract(field) - 0.5) * 2.0;
    vContourLine = smoothstep(0.62, 0.98, iso) * uContour * (1.0 - hair);

    float radial = length(base);
    float tip = smoothstep(1.05, 1.9, radial) * uTipGlow;
    float glowE = scatter * (0.5 + aSeed * 0.7) * (1.0 - skinLock);
    float twinkle = 0.85 + 0.15 * sin(uTime * 1.8 + aSeed * 30.0);
    vGlow = clamp(max(glowE, tip * (0.55 + aSeed * 0.45)) * twinkle, 0.0, 1.0);
    vGlow *= (1.0 - uSettle * 0.85); // the remnant debris shouldn't glow hot
    vColor = aColor;
    vReveal = uPortraitReveal;
  }
`

export const particleFragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3 uColorLight;
  uniform vec3 uColorEmber;
  uniform vec3 uColorHot;
  uniform vec3 uStrand;
  uniform float uPortrait;
  uniform float uContour;
  uniform float uSettle;

  varying float vGlow;
  varying vec3 vColor;
  varying float vContourLine;
  varying float vHair;
  varying float vReveal;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.1, d);
    // vReveal (uPortraitReveal) is plumbed through for a future photoreal-mesh
    // handoff (see HeadMesh.tsx's follow-up note) but not applied yet — the
    // particle portrait is the only hero right now, so it stays fully visible.

    vec3 structural = mix(uColorLight, uColorEmber, smoothstep(0.06, 0.6, vGlow));
    structural = mix(structural, uColorHot, smoothstep(0.6, 1.0, vGlow));

    vec3 photo = mix(vColor, uColorHot, smoothstep(0.45, 1.0, vGlow));

    // Contour scheme: the face reads as a dim topographic shell with bright
    // warm-white isolines — not mostly-invisible. Between-line particles stay
    // at ~40% so the head keeps its form through the flip.
    vec3 shell = mix(vColor * 0.5, uStrand, 0.35);
    vec3 lineCol = uStrand;
    vec3 contourCol = mix(shell, lineCol, vContourLine);
    float skinContour = uContour * (1.0 - vHair);
    photo = mix(photo, contourCol, skinContour);
    alpha *= mix(1.0, mix(0.4, 1.0, vContourLine), skinContour);

    vec3 col = mix(structural, photo, uPortrait);
    float boost = 1.0 + vGlow * mix(1.5, 0.8, uPortrait) + vContourLine * 1.6;
    col *= boost;

    // Fade hard to a whisper of drifting embers so the filaments own the frame.
    alpha *= mix(1.0, 0.04, uSettle);

    gl_FragColor = vec4(col, alpha);
  }
`
