// PROTOTYPE, throwaway: the keystroke waves' shader, every value a uniform so the page can tune
// it live. No noise, no fbm: a halo, then at most `MAX_WAVES` thin rings, each a smoothstep on
// its distance to the wavefront. Premultiplied alpha, faded out before the canvas's edge.

export const PROTOTYPE_FRAGMENT = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uWaves[6];
uniform float uFlash;
uniform vec3 uLight;
uniform vec3 uMid;
uniform vec3 uDeep;
uniform float uBirth;
uniform float uReach;
uniform float uCurve;
uniform float uThickness;
uniform float uTrail;
uniform float uHalo;
uniform float uFlashGain;

out vec4 color;

void main() {
  vec2 p = gl_FragCoord.xy / uResolution * 2.0 - 1.0;
  float r = length(p);
  float pixel = 2.0 / uResolution.y;
  float edge = smoothstep(1.0, 0.86, r);

  // The halo against the metal, lit up by each hit, whiter as it flashes.
  // In coral, not the metal's crease: a light, never a brown plate.
  float halo = smoothstep(0.92, 0.45, r) * smoothstep(0.2, 0.42, r);
  float glow = halo * halo * (uHalo + uFlashGain * uFlash);
  vec3 glowColor = mix(uMid, uLight, 0.35 * uFlash);

  // Each wave slows as it spreads, thins, and cools from pale to coral as it fades.
  vec3 ring = vec3(0.0);
  float ringAlpha = 0.0;

  for (int i = 0; i < 6; i++) {
    float age = uWaves[i];

    if (age < 0.0) {
      continue;
    }

    float radius = mix(uBirth, uReach, 1.0 - pow(1.0 - age, uCurve));
    float halfWidth = 0.5 * uThickness * (1.0 - 0.6 * age);
    float d = r - radius;
    float line = 1.0 - smoothstep(halfWidth, halfWidth + pixel, abs(d));
    float trail = uTrail * exp(d / 0.06) * step(d, 0.0);
    float fade = (1.0 - age) * (1.0 - age);
    float a = clamp(line + trail, 0.0, 1.0) * fade;

    ring += mix(uLight, uMid, age) * a;
    ringAlpha += a;
  }

  ringAlpha = clamp(ringAlpha * edge, 0.0, 1.0);
  ring = min(ring * edge, vec3(ringAlpha));
  glow *= edge;

  color = vec4(glowColor * glow * (1.0 - ringAlpha) + ring, glow * (1.0 - ringAlpha) + ringAlpha);
}`;
