/**
 * Shared GLSL. `strandPoint(root, tipHead, u, strand, time, uT)` returns the
 * centre-line position of one strand at parameter u ∈ [0,1], blended across the
 * four shapes of the reference finale by raw scroll progress uT:
 *
 *   head   — grows out of its root on the head, gentle bow      (uT < ~0.5)
 *   cable  — all strands packed into one rope from top-right     (~0.5–0.6)
 *   sphere — coiled over a ball, a tail entering from top-left   (~0.6–0.75)
 *   vortex — a flat spiral swirling around a blazing core        (~0.75–1.0)
 *
 * The filament vertex shader evaluates this at u±eps to get a tangent and
 * builds a camera-facing ribbon around it.
 */
/** Where the cable / sphere / vortex are composed — right-of-centre, clear of
 *  the chapter copy. Mirrors SF_CENTER in the GLSL below. */
export const FINALE_CENTER: [number, number, number] = [0.85, 0.15, 0]

export const STRAND_FORMS_GLSL = /* glsl */ `
  #define SF_TAU 6.28318530718

  vec3 sfHash3(float n) {
    return fract(sin(n * vec3(12.9898, 78.233, 45.164)) * 43758.5453) * 2.0 - 1.0;
  }

  vec3 sfFormHead(vec3 root, vec3 tipHead, float u, float seed) {
    vec3 p = mix(root, tipHead, u);
    vec3 bow = normalize(cross(tipHead - root, vec3(0.0, 1.0, 0.2)) + vec3(0.001));
    p += bow * sin(u * 3.14159265) * (0.22 + seed * 0.42);
    return p;
  }

  // The finale sits right-of-centre, clear of the left-aligned chapter copy.
  const vec3 SF_CENTER = vec3(0.85, 0.15, 0.0);

  vec3 sfFormCable(float u, float seed, vec3 h3) {
    // Rope centre-line: enters off-screen top-right, curves down, its cut end
    // turning toward the camera so you see the bundle of fibre ends.
    vec3 a = vec3(3.8, 3.4, -0.6);
    vec3 b = vec3(1.7, 1.1, 0.4);
    vec3 c = SF_CENTER + vec3(-0.1, -0.3, 1.4);
    vec3 mid = mix(mix(a, b, u), mix(b, c, u), u);

    // frame that follows the rope, so the packed offset stays circular in
    // cross-section rather than smearing along one axis
    vec3 dir = normalize(mix(b - a, c - b, u) + vec3(0.001));
    vec3 e1 = normalize(cross(dir, vec3(0.0, 1.0, 0.0)) + vec3(0.001));
    vec3 e2 = cross(dir, e1);

    float ang = seed * SF_TAU + u * 2.4;                 // slow twist
    float rad = 0.03 + 0.11 * sqrt(h3.x * 0.5 + 0.5);    // tight bundle
    rad *= 1.0 + smoothstep(0.82, 1.0, u) * 9.0;         // splay only at the cut end
    return mid + (cos(ang) * e1 + sin(ang) * e2) * rad;
  }

  vec3 sfFormSphere(float u, float seed, vec3 h3) {
    float R = 1.4;
    vec3 poleN = normalize(vec3(-0.5, 0.78, -0.28));
    vec3 entry = SF_CENTER + poleN * R;
    // the cable tail arcing in from the top-left — a bundled rope, not a line
    vec3 tailA = SF_CENTER + vec3(-3.4, 2.6, -0.5);
    vec3 tailB = SF_CENTER + poleN * (R + 1.1);
    float tailU = smoothstep(0.0, 0.22, u);
    float tp = tailU;
    vec3 tailMid = mix(mix(tailA, tailB, tp), mix(tailB, entry, tp), tp);
    vec3 tdir = normalize(entry - tailA);
    vec3 tperp = normalize(cross(tdir, vec3(0.0, 1.0, 0.0)) + vec3(0.001));
    float tang = seed * SF_TAU + tp * 2.0;
    vec3 tail = tailMid + (cos(tang) * tperp + sin(tang) * cross(tdir, tperp)) * 0.12;

    float t = clamp((u - 0.18) / 0.82, 0.0, 1.0);
    // each strand owns a latitude band and sweeps out+back within it, so the
    // strands wrap the whole ball instead of converging at one pole
    float lat0 = 0.18 + seed * 2.55;
    float phi = lat0 + sin(t * 3.14159265) * 1.35 + h3.y * 0.18;
    float turns = 3.0 + fract(seed * 7.13) * 4.0;
    float theta = seed * SF_TAU * 3.0 + t * turns * SF_TAU;
    vec3 up = abs(poleN.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 e1 = normalize(cross(poleN, up));
    vec3 e2 = cross(poleN, e1);
    vec3 dir = cos(phi) * poleN + sin(phi) * (cos(theta) * e1 + sin(theta) * e2);
    vec3 coil = SF_CENTER + dir * (R + h3.z * 0.12);
    return mix(tail, coil, tailU);
  }

  vec3 sfFormVortex(float u, float seed, vec3 h3, float time, float uT) {
    float r = mix(0.10, 2.1, pow(u, 0.72));
    // swirl is mostly scroll-driven (tightens as you scroll into it) with a
    // slow idle drift on top
    float spin = uT * 9.0 + time * 0.12;
    float ang = seed * SF_TAU + u * (5.0 + seed * 2.2) + spin * (1.0 - u * 0.55);
    vec3 p = vec3(cos(ang) * r, sin(ang) * r * 0.60, sin(ang * 0.5) * 0.20 * (1.0 - u));
    p.z += h3.z * 0.09;
    p.yz = mat2(0.93, -0.36, 0.36, 0.93) * p.yz;   // tilt the disc
    return SF_CENTER + p;
  }

  vec3 strandPoint(vec3 root, vec3 tipHead, float u, float strand, float time, float uT) {
    float seed = fract(strand * 0.61803398875 + 0.1234);
    vec3 h3 = sfHash3(strand * 17.0 + 3.0);

    float wHead   = 1.0 - smoothstep(0.46, 0.56, uT);
    float wCable  = smoothstep(0.46, 0.56, uT) * (1.0 - smoothstep(0.60, 0.68, uT));
    float wSphere = smoothstep(0.60, 0.68, uT) * (1.0 - smoothstep(0.77, 0.87, uT));
    float wVortex = smoothstep(0.77, 0.87, uT);
    float sum = wHead + wCable + wSphere + wVortex + 1e-4;

    vec3 p =
      sfFormHead(root, tipHead, u, seed) * wHead +
      sfFormCable(u, seed, h3) * wCable +
      sfFormSphere(u, seed, h3) * wSphere +
      sfFormVortex(u, seed, h3, time, uT) * wVortex;
    return p / sum;
  }
`
