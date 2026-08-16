/**
 * GLSL for the particle field.
 *
 * Each particle stores TWO target positions (aFrom, aTo) plus a random seed.
 * The vertex shader blends between them by uBlend, and adds a dispersal field
 * scaled by uEnergy — explosion + vortex + per-particle chaos + churn — so a
 * transition reads as a real disintegrate-and-reform: pristine shape at the
 * ends, a churning ember cloud in the middle. Color lerps warm-dark -> ember ->
 * hot with glow (from morph energy and a static radius-based tip glow), giving
 * the glowing morph-front and lit fiber tips. The fragment shader draws soft
 * round sprites that bloom picks up.
 */

export const particleVertexShader = /* glsl */ `
  precision highp float;

  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute float aSeed;
  attribute vec3 aColor;   // per-particle photo color (from the portrait)

  uniform float uBlend;     // 0..1 morph between aFrom and aTo
  uniform float uEnergy;    // 0..1 transition energy (turbulence + glow)
  uniform float uTime;
  uniform float uSize;      // base point size factor (world-ish)
  uniform float uPixelRatio;
  uniform float uScale;     // 0.5 * viewport height (px) — perspective size scale
  uniform float uTipGlow;   // 0..1 how strongly this shape lights its outer tips
  uniform float uLift;      // 0..1 airplane takeoff (0 for every non-plane shape)

  varying float vGlow;
  varying float vSeed;
  varying vec3 vColor;

  // Cheap flow-noise displacement (not true curl noise, but reads similarly and
  // is far cheaper for tens of thousands of points).
  vec3 flow(vec3 p, float t) {
    float a = sin(p.y * 3.0 + t) + cos(p.z * 2.3 - t * 0.7);
    float b = sin(p.z * 2.7 - t * 1.1) + cos(p.x * 3.1 + t * 0.5);
    float c = sin(p.x * 2.5 + t * 0.9) + cos(p.y * 2.9 - t * 0.6);
    return vec3(a, b, c);
  }

  void main() {
    // Per-particle staggered morph. Instead of every particle crossing from
    // aFrom to aTo in lockstep (which parks them all at a formless midpoint —
    // the "blank frame" between shapes), each particle crosses within its own
    // sub-window of the transition, offset by its seed. So as the old shape
    // dissolves, the particles that moved first are ALREADY assembling the new
    // one: a continuous cross-dissolve with structure on screen the whole time.
    float spread = 0.55;                 // how staggered the crossings are
    float startT = aSeed * spread;       // this particle's crossing start
    float local = clamp((uBlend - startT) / (1.0 - spread), 0.0, 1.0);
    float bl = smoothstep(0.0, 1.0, local);
    vec3 lerped = mix(aFrom, aTo, bl);

    // Airplane takeoff: pitch the plane nose-up about its tail and arc it into a
    // climb. uLift ramps 0 -> ~1 -> 0 across the aviation chapter. Scaled by
    // (1 - bl) so only particles that are still "the plane" lift — points that
    // have already crossed into the next shape are left where they belong.
    float lift = uLift * (1.0 - bl);
    if (lift > 0.0001) {
      float pitch = lift * 0.5; // radians of nose-up rotation
      float cs = cos(pitch);
      float sn = sin(pitch);
      // Rotate in the x-y plane about a pivot near the tail wheel.
      vec2 piv = vec2(-0.9, -0.72);
      vec2 rel = lerped.xy - piv;
      vec2 rot = vec2(rel.x * cs - rel.y * sn, rel.x * sn + rel.y * cs);
      lerped.xy = piv + rot;
      // Climb path: accelerate up and forward as it leaves the ground.
      lerped.y += lift * lift * 1.7;
      lerped.x += lift * 0.9;
    }

    // Per-particle transit: 0 at both ends of THIS particle's crossing, peaks
    // while it's mid-flight. Only in-flight particles scatter/glow — settled old
    // and settled new particles stay crisp, which is what makes it read as a
    // cross-dissolve rather than one cloud exploding then re-forming.
    float s = sin(bl * 3.14159265);

    // Scatter = a gentle outward puff + a vortex swirl + per-particle chaos +
    // flowing churn. Kept modest (and never a big radial explosion) so the cloud
    // stays dense — it swirls between forms, it doesn't thin into empty haze.
    vec3 rad = normalize(lerped + vec3(0.0001));
    vec3 tang = normalize(vec3(-lerped.z, lerped.x * 0.35, lerped.x) + vec3(0.0001));
    vec3 seededDir = normalize(vec3(
      sin(aSeed * 12.9 + lerped.y * 3.0),
      cos(aSeed * 7.7 + lerped.z * 2.3),
      sin(aSeed * 5.3 + lerped.x * 4.1)
    ));
    vec3 churn = flow(lerped * 1.5 + vec3(aSeed * 6.2831), uTime * 0.8);

    float mag = s * (0.42 + aSeed * 0.55);
    vec3 pos = lerped
      + rad * mag * 0.30          // gentle outward puff — kept small so the
                                  //   cloud never thins into an empty haze
      + tang * mag * 0.52         // swirl into a vortex — keeps it churning
      + seededDir * mag * 0.30    // per-particle chaos
      + churn * s * 0.32;         // organic churn

    // Always-on gentle drift so even settled forms breathe (never dead-static).
    pos += flow(lerped * 1.15 + vec3(aSeed * 6.2831), uTime * 0.22) * 0.016;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    // Perspective point size: uScale carries the viewport height so points read
    // at a consistent on-screen size regardless of resolution. Larger mid-morph
    // so the dispersal cloud has presence. Clamped so nothing vanishes/balloons.
    float sizeVar = (0.7 + aSeed * 0.6) * (1.0 + s * 1.15);
    float px = uSize * sizeVar * uPixelRatio * (uScale / max(-mv.z, 0.001));
    gl_PointSize = clamp(px, 1.0, 96.0);

    // Glow: (1) morph energy — the ember front as particles blow apart;
    // (2) static tip glow — outer particles stay ember-lit at rest, so the
    // radiating fibers keep glowing tips. A slow twinkle keeps tips alive.
    float radial = length(lerped);
    float tip = smoothstep(1.1, 1.95, radial) * uTipGlow;
    float glowE = s * (0.6 + aSeed * 0.9);
    float glowT = tip * (0.55 + aSeed * 0.45);
    float twinkle = 0.85 + 0.15 * sin(uTime * 1.8 + aSeed * 30.0);
    vGlow = clamp(max(glowE, glowT) * twinkle, 0.0, 1.0);
    vSeed = aSeed;
    vColor = aColor;
  }
`

export const particleFragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3 uColorDark;
  uniform vec3 uColorEmber;
  uniform vec3 uColorHot;
  uniform float uPortrait;  // 1 = show the photo face, 0 = structural/ember scheme

  varying float vGlow;
  varying float vSeed;
  varying vec3 vColor;

  void main() {
    // Round soft sprite.
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.08, d);

    // Structural scheme: dark at rest -> ember -> hot core as glow rises.
    vec3 structural = mix(uColorDark, uColorEmber, smoothstep(0.05, 0.6, vGlow));
    structural = mix(structural, uColorHot, smoothstep(0.6, 1.0, vGlow));

    // Photo scheme: the real face color, which catches ember as it heats up and
    // shatters (so the face literally burns into embers on scroll).
    vec3 photo = mix(vColor, uColorHot, smoothstep(0.4, 1.0, vGlow));

    // Blend the two by how "portrait" the current form is.
    vec3 col = mix(structural, photo, uPortrait);

    // Bright particles are boosted so bloom catches them; the settled face is
    // boosted less so it looks like a photo, not a lantern.
    float boost = 1.0 + vGlow * mix(2.2, 1.3, uPortrait);
    gl_FragColor = vec4(col * boost, alpha);
  }
`
