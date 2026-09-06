import { DISSOLVE_GLSL } from './dissolve'

/**
 * GLSL for the particle field — the debris the head mesh dissolves into.
 *
 * Each particle has a home position on the head surface (aFrom). It stays
 * invisible, hidden behind the solid mesh, until the sweep front reaches it
 * (uDissolve crosses dissolveField(home)); at that instant it "detaches",
 * flares ember-hot, and blows backward into the scene, cooling to pale dust and
 * fading out as the strands take over (uSettle).
 *
 * Complementary by construction: the mesh shader discards exactly the fragments
 * this shader brings to life, using the same dissolveField.
 */

export const particleVertexShader = /* glsl */ `
  precision highp float;

  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute float aSeed;
  attribute vec3 aColor;
  attribute vec3 aNormal;

  uniform float uDissolve;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uScale;
  uniform float uSettle;
  uniform float uTipGlow;

  varying vec3 vColor;
  varying float vAge;
  varying float vBurn;
  varying float vLight;

  float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

  vec3 flow(vec3 p, float t) {
    float a = sin(p.y * 3.0 + t) + cos(p.z * 2.3 - t * 0.7);
    float b = sin(p.z * 2.7 - t * 1.1) + cos(p.x * 3.1 + t * 0.5);
    float c = sin(p.x * 2.5 + t * 0.9) + cos(p.y * 2.9 - t * 0.6);
    return vec3(a, b, c);
  }

  ${DISSOLVE_GLSL}

  void main() {
    vec3 home = aFrom;
    float field = dissolveField(home);

    // Has the sweep front reached this particle yet? (0 until, sharp at, 1 past)
    float born = smoothstep(field, field + 0.04, uDissolve);
    // Ember flash right at the front — thin, gone almost immediately.
    vBurn = born * (1.0 - smoothstep(field + 0.008, field + 0.045, uDissolve));

    // Cull: unborn particles (mesh covers them) and most spent debris.
    float keep = mix(1.0, 0.10, smoothstep(0.35, 0.95, uSettle));
    if (born < 0.001 || aSeed > keep) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      return;
    }

    // Age since detaching: grows as the front moves on and as things settle.
    float age = clamp(uDissolve - field, 0.0, 1.2) * 1.5 + uSettle * 1.1;
    vAge = clamp(age, 0.0, 1.0);

    // Blow backward into the scene (−Z), slight lift, plus a seeded fan and slow
    // curl — matches the reference's "voxels blowing backward into 3D space".
    vec3 seeded = normalize(vec3(
      sin(aSeed * 12.9 + home.y * 3.0),
      cos(aSeed * 7.7 + home.z * 2.3) + 0.25,
      sin(aSeed * 5.3 + home.x * 4.1) - 0.15
    ));
    vec3 back = normalize(vec3(0.10, 0.18, -1.0));
    vec3 dir = normalize(mix(seeded, back, 0.55));
    vec3 curl = flow(home * 1.6 + vec3(aSeed * 6.2831), uTime * 0.6);

    float travel = age * (0.5 + aSeed * 0.9) * 2.4;
    vec3 pos = home + dir * travel + curl * age * 0.22;
    // gentle constant shimmer before it really moves
    pos += flow(home * 1.15 + vec3(aSeed * 6.2831), uTime * 0.25) * 0.012 * (1.0 - vAge);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float sizeVar = (0.75 + aSeed * 0.7);
    sizeVar *= mix(0.7, 1.25, vBurn);          // briefly bigger as it flares
    sizeVar *= mix(1.0, 0.35, vAge);           // shrinks as it cools
    float px = uSize * sizeVar * uPixelRatio * (uScale / max(-mv.z, 0.001));
    gl_PointSize = clamp(px, 1.0, 80.0);

    // A little residual lighting from the surface it just left, fading with age.
    vec3 nrm = normalize(normalMatrix * aNormal);
    float key = max(dot(nrm, normalize(vec3(0.5, 0.42, 0.78))), 0.0);
    vLight = mix(0.34 + 0.92 * key, 1.0, vAge);

    float twinkle = 0.8 + 0.2 * sin(uTime * 2.0 + aSeed * 30.0);
    vColor = aColor * twinkle;
    // keep uTipGlow referenced (tuning hook for tip brightness)
    vLight += uTipGlow * 0.0;
  }
`

export const particleFragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3 uColorLight;
  uniform vec3 uColorEmber;
  uniform vec3 uColorHot;
  uniform vec3 uStrand;
  uniform float uSettle;

  varying vec3 vColor;
  varying float vAge;
  varying float vBurn;
  varying float vLight;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.12, d);

    // Skin colour when fresh -> pale dust as it cools.
    vec3 skin = vColor * vLight;
    vec3 dust = mix(uColorLight, uStrand, 0.6);
    vec3 col = mix(skin, dust, clamp(vAge * 1.4, 0.0, 1.0));

    // Ember flash at the moment it detaches — tight, at the front only.
    col = mix(col, uColorHot, vBurn * 0.6);
    col += uColorEmber * vBurn * 0.22;

    // Fade: a touch as it ages, hard once the strands lead.
    alpha *= mix(1.0, 0.28, vAge);
    alpha *= mix(1.0, 0.05, uSettle);

    float boost = 1.0 + vBurn * 1.6;
    gl_FragColor = vec4(col * boost, alpha);
  }
`
