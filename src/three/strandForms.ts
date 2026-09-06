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

  // Head phase: root and tip are given in HEAD-LOCAL space (roots sit on the
  // back of the skull) and transformed by uHeadMat, so the fibres stay planted
  // in the scalp as the head pitches back and turns away.
  vec3 sfFormHead(vec3 root, vec3 tipHead, float u, float seed, mat4 headMat) {
    vec3 p = mix(root, tipHead, u);
    vec3 bow = normalize(cross(tipHead - root, vec3(0.0, 1.0, 0.2)) + vec3(0.001));
    p += bow * sin(u * 3.14159265) * (0.22 + seed * 0.42);
    return (headMat * vec4(p, 1.0)).xyz;
  }

  // The finale sits right-of-centre, clear of the left-aligned chapter copy.
  const vec3 SF_CENTER = vec3(0.85, 0.15, 0.0);

  vec3 sfFormCable(float u, float seed, vec3 h3) {
    // Rope centre-line: enters off-screen top-right, curves down, its cut end
    // turning toward the camera so you see the bundle of fibre ends.
    vec3 a = vec3(4.6, 3.6, -1.0);
    vec3 b = vec3(1.9, 1.2, 0.1);
    vec3 c = SF_CENTER + vec3(-1.5, -1.6, 0.7);
    vec3 mid = mix(mix(a, b, u), mix(b, c, u), u);

    // frame that follows the rope, so the packed offset stays circular in
    // cross-section rather than smearing along one axis
    vec3 dir = normalize(mix(b - a, c - b, u) + vec3(0.001));
    vec3 e1 = normalize(cross(dir, vec3(0.0, 1.0, 0.0)) + vec3(0.001));
    vec3 e2 = cross(dir, e1);

    float ang = seed * SF_TAU + u * 2.4;                 // slow twist
    float rad = 0.03 + 0.10 * sqrt(h3.x * 0.5 + 0.5);    // tight bundle
    rad *= 1.0 + smoothstep(0.88, 1.0, u) * 3.2;         // slight fray at the cut end
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

  // Chrysanthemum (reference frames 033 / 039): every cord leaves a hot centre
  // at the front pole, arcs out over a DOME, and finishes just past the
  // equator so its tip points outward at the rim. Not a flat disc — the dome
  // is what gives the packed-petal look.
  vec3 sfFormVortex(float u, float seed, vec3 h3, float time, float uT) {
    float R = 1.34 * (0.96 + h3.y * 0.07);
    float spin = uT * 1.5 + time * 0.07;
    // Polar angle: 0 = pole facing camera (the core). Stops BEFORE the equator
    // (1.57) so every cord's glowing tip still faces the viewer — that ring of
    // orange ferrules around the bloom is the signature of frames 033 / 039.
    // Start almost at the pole so the cords converge to a knot and close the
    // centre — a wider inner ring left a hole you could see the page through.
    float phi = mix(0.045, 1.36, pow(u, 0.9));
    // azimuth: fixed per cord, with a light curl so the bloom swirls
    float theta = seed * SF_TAU + u * (0.55 + seed * 0.25) + spin;
    vec3 dir = vec3(sin(phi) * cos(theta), sin(phi) * sin(theta), cos(phi));
    return SF_CENTER + dir * R;
  }

  vec3 strandPoint(
    vec3 root, vec3 tipHead, float u, float strand, float time, float uT, mat4 headMat
  ) {
    float seed = fract(strand * 0.61803398875 + 0.1234);
    vec3 h3 = sfHash3(strand * 17.0 + 3.0);

    float wHead   = 1.0 - smoothstep(0.46, 0.56, uT);
    float wCable  = smoothstep(0.46, 0.56, uT) * (1.0 - smoothstep(0.60, 0.68, uT));
    float wSphere = smoothstep(0.60, 0.68, uT) * (1.0 - smoothstep(0.77, 0.87, uT));
    float wVortex = smoothstep(0.77, 0.87, uT);
    float sum = wHead + wCable + wSphere + wVortex + 1e-4;

    vec3 p =
      sfFormHead(root, tipHead, u, seed, headMat) * wHead +
      sfFormCable(u, seed, h3) * wCable +
      sfFormSphere(u, seed, h3) * wSphere +
      sfFormVortex(u, seed, h3, time, uT) * wVortex;
    return p / sum;
  }
`
