/**
 * Shared GLSL. Given a point in the head's fitted local space, `dissolveField`
 * returns the value of `uDissolve` at which that point is consumed by the sweep
 * front (0 = goes first, 1 = goes last). The mesh shader `discard`s fragments
 * once the front has passed them; the particle shader spawns a particle at the
 * same instant — so the head visibly "eats itself" into particles along one
 * moving edge, exactly matching where the mesh disappears.
 *
 * `uDissolve` runs 0 -> DISSOLVE_MAX; the extra past 1 clears the noisy tail of
 * the field so nothing is left behind. Both shaders scale the slicePhases
 * `dissolve` beat (0..1) by this.
 *
 * Must be byte-identical in both shaders. The front direction roughly matches
 * the reference: it starts on the model's right (viewer's left) / upper area
 * and sweeps across and down, with a noisy edge so it crumbles rather than
 * wipes.
 */
export const DISSOLVE_MAX = 1.15

export const DISSOLVE_GLSL = /* glsl */ `
  float dsvHash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float dsvNoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(dsvHash(i + vec3(0,0,0)), dsvHash(i + vec3(1,0,0)), f.x),
          mix(dsvHash(i + vec3(0,1,0)), dsvHash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(dsvHash(i + vec3(0,0,1)), dsvHash(i + vec3(1,0,1)), f.x),
          mix(dsvHash(i + vec3(0,1,1)), dsvHash(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }

  float dissolveField(vec3 p) {
    // Sweep axis: from the model's right + top toward its left + bottom.
    float sweep = dot(p, normalize(vec3(-0.90, 0.34, 0.18)));
    float base = (sweep + 1.55) / 3.0;
    base += (dsvNoise(p * 2.3) - 0.5) * 0.24;
    base += (dsvNoise(p * 6.5) - 0.5) * 0.09;
    return clamp(base, 0.0, 1.0);
  }
`
