import type { Tier } from "ranked";

import { type FullAuraTier, hasFullAura } from "@/components/aura/aura-paint";
import { HOT, METALS } from "@/components/tier/sprite/tier-sprite-paint";

// The shaders of the full Aura: a quad over the whole canvas, then one fragment shader per Tier
// that has one, all procedural (hash and noise, no texture, no particle buffer). The canvas is
// half as large again as the Ornament's box, itself twice the avatar: from the centre, the
// avatar's edge at 1/3, the box's at 2/3, the canvas's at 1, where every Aura fades out so its
// square never shows.

// Four corners in a strip, from the vertex id alone: no buffer.
export const QUAD_VERTEX = `#version 300 es
void main() {
  vec2 corner = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1));
  gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}`;

const NOISE = `
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}`;

// Gold: a warm halo from the metal of Gold, breathing, its light stirring slowly around the Ornament,
// and a few glints that twinkle in it. Premultiplied alpha.
const GOLD_FRAGMENT = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uLight;
uniform vec3 uMid;
uniform vec3 uDeep;

out vec4 color;
${NOISE}

void main() {
  vec2 p = gl_FragCoord.xy / uResolution * 2.0 - 1.0;
  float r = length(p);
  vec2 around = p / max(r, 0.001);

  // Rising from the avatar's edge, strongest through the metal, gone at the canvas's edge.
  float halo = smoothstep(1.0, 0.5, r) * smoothstep(0.25, 0.45, r);

  // The light stirs around the circle: noise on the unit circle, so it has no seam.
  float stir = noise(around * 2.2 + vec2(uTime * 0.18, -uTime * 0.13));
  float breath = 0.82 + 0.18 * sin(uTime * 1.4);
  float light = halo * halo * (0.55 + 0.45 * stir) * breath;

  // One glint at most per cell, twinkling on its own beat, only just beyond the metal.
  vec2 cell = floor(p * 7.0);
  float seed = hash(cell);
  vec2 spot = (cell + 0.2 + 0.6 * vec2(seed, hash(cell + 7.1))) / 7.0;
  float twinkle = pow(max(sin(uTime * (0.9 + seed) + seed * 40.0), 0.0), 12.0);
  float ring = smoothstep(0.95, 0.78, r) * smoothstep(0.6, 0.7, r);
  float glint = smoothstep(0.025, 0.0, length(p - spot)) * twinkle * ring * step(0.55, seed);

  vec3 warm = mix(uDeep, uMid, halo);
  float alpha = clamp(light * 0.75 + glint, 0.0, 1.0);
  color = vec4(mix(warm * light * 0.75, uLight * alpha, glint), alpha);
}`;

// Platinum: a cool halo from the metal of Platinum, fuller than Gold's, its light drifting upward in
// plumes, and motes of light rising gently in three layers from behind the drawing, each wobbling
// and flickering on its own beat, fading out as they climb. Premultiplied alpha.
const PLATINUM_FRAGMENT = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uLight;
uniform vec3 uMid;
uniform vec3 uDeep;

out vec4 color;
${NOISE}

// One layer of motes: columns of cells scrolling up, each column at its own pace, one mote at
// most per cell. The larger the scale, the smaller and slower the motes: further away.
float motes(vec2 p, float scale, float rise) {
  vec2 q = p * scale;
  float column = floor(q.x);
  float pace = 0.6 + 0.8 * hash(vec2(column, scale));
  q.y -= uTime * rise * scale * pace;
  vec2 cell = floor(q);
  float seed = hash(cell + scale);
  vec2 spot = vec2(0.5 + 0.28 * sin(uTime * (0.6 + seed) + seed * 30.0), 0.2 + 0.6 * hash(cell + 3.7));
  float d = length(fract(q) - spot);
  float size = 0.06 + 0.06 * seed;
  // A bright core in a soft glow.
  float mote = smoothstep(size, 0.0, d) + 0.35 * pow(smoothstep(size * 3.5, 0.0, d), 2.0);
  float flicker = 0.65 + 0.35 * sin(uTime * (2.0 + 3.0 * seed) + seed * 20.0);

  return mote * flicker * step(0.62, seed);
}

void main() {
  vec2 p = gl_FragCoord.xy / uResolution * 2.0 - 1.0;
  float r = length(p);
  vec2 around = p / max(r, 0.001);

  // Wider than Gold's, strongest through the metal, gone at the canvas's edge.
  float halo = smoothstep(1.0, 0.42, r) * smoothstep(0.22, 0.42, r);

  // The light stirs around the circle, and plumes of it drift up, above the Ornament mostly.
  float stir = noise(around * 2.4 + vec2(uTime * 0.2, -uTime * 0.15));
  float plume = noise(vec2(p.x * 3.0, p.y * 2.2 - uTime * 0.45)) * smoothstep(-0.3, 0.6, p.y);
  float breath = 0.85 + 0.15 * sin(uTime * 1.2);
  float light = halo * halo * (0.5 + 0.35 * stir + 0.4 * plume) * breath;

  // Born behind the drawing, the motes show beyond it, then fade as they near the canvas's edge.
  float rising = smoothstep(-0.55, 0.1, p.y) * smoothstep(1.0, 0.6, p.y);
  float envelope = rising * smoothstep(0.98, 0.7, r) * smoothstep(0.95, 0.35, abs(p.x));
  float dust = clamp(motes(p, 7.0, 0.09) + 0.8 * motes(p, 11.0, 0.065) + 0.6 * motes(p, 17.0, 0.045), 0.0, 1.0) * envelope;

  // The halo, then the motes over it.
  float veil = light * 0.8;
  vec3 cool = mix(uDeep, uMid, halo) * veil;
  vec3 mote = mix(uMid, uLight, dust) * dust;
  color = vec4(cool * (1.0 - dust) + mote, veil * (1.0 - dust) + dust);
}`;

// Diamond: a gem's light, richer than Platinum's. Its widest halo is cut into facets, each lit on
// its own beat, crossed by prismatic bands that slide slowly around the Ornament: each channel
// a little behind the next, as light splits through a prism, always between the metal's colours.
// A bright arc of refraction turns around it, and four-pointed glints twinkle in two layers.
// Premultiplied alpha.
const DIAMOND_FRAGMENT = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uLight;
uniform vec3 uMid;
uniform vec3 uDeep;

out vec4 color;
${NOISE}

const float TAU = 6.2831853;
const float FACETS = 12.0;

// The prism's bands at angle a and radius r, shifted by the channel's phase: a whole number of
// turns around the circle, so they have no seam.
float bands(float a, float r, float phase) {
  return 0.5 + 0.5 * cos(a * 3.0 + r * 9.0 - uTime * 0.35 + phase);
}

// A four-pointed star: a bright core and two thin arms, short enough to stay in its cell.
float star(vec2 d, float size) {
  float core = smoothstep(size, 0.0, length(d));
  float arms = smoothstep(size * 0.18, 0.0, abs(d.x)) * smoothstep(size * 2.2, 0.0, abs(d.y))
    + smoothstep(size * 0.18, 0.0, abs(d.y)) * smoothstep(size * 2.2, 0.0, abs(d.x));

  return core + 0.7 * arms;
}

// One layer of glints: one at most per cell, dark most of the time, flashing on its own beat.
float glints(vec2 p, float scale, float rate) {
  vec2 q = p * scale;
  vec2 cell = floor(q);
  float seed = hash(cell + scale);
  vec2 spot = 0.35 + 0.3 * vec2(seed, hash(cell + 5.3));
  float twinkle = pow(max(sin(uTime * rate * (0.7 + seed) + seed * 50.0), 0.0), 12.0);

  return star(fract(q) - spot, 0.14) * twinkle * step(0.4, seed);
}

// How bright a facet is now: each on its own beat.
float faceLight(float facet) {
  return 0.55 + 0.45 * sin(uTime * (0.5 + hash(vec2(facet, 1.0))) + hash(vec2(facet, 2.0)) * TAU);
}

void main() {
  vec2 p = gl_FragCoord.xy / uResolution * 2.0 - 1.0;
  float r = length(p);
  vec2 around = p / max(r, 0.001);
  float a = atan(p.y, p.x);

  // The widest halo yet, strongest through the metal, gone at the canvas's edge.
  float halo = smoothstep(1.0, 0.4, r) * smoothstep(0.2, 0.4, r);

  // Facets turning slowly, each lit on its own beat, blending into the next at their edge.
  // Counted modulo their number, so the facet across the seam of atan is one facet.
  float turn = a / TAU * FACETS + uTime * 0.08;
  float facet = floor(turn);
  float face = mix(faceLight(mod(facet, FACETS)), faceLight(mod(facet + 1.0, FACETS)), smoothstep(0.75, 1.0, fract(turn)));

  // The light stirs, and an arc of refraction turns around the Ornament.
  float stir = noise(around * 2.0 + vec2(uTime * 0.15, -uTime * 0.1));
  float sweep = pow(0.5 + 0.5 * cos(a - uTime * 0.4), 8.0);
  float breath = 0.88 + 0.12 * sin(uTime * 1.1);
  float light = halo * halo * (0.45 + 0.3 * stir + 0.35 * face + 0.4 * sweep) * breath;

  // Each channel of the prism a third of a turn behind the next, between the metal's body and its
  // highlight: the light splits, and never leaves the Diamond's colours.
  vec3 prism = vec3(bands(a, r, 0.0), bands(a, r, 2.1), bands(a, r, 4.2));
  vec3 tint = mix(uMid, uLight, prism);

  // Born behind the drawing, the glints show beyond it, and fade out before the canvas's edge.
  float ring = smoothstep(0.98, 0.75, r) * smoothstep(0.35, 0.5, r);
  float sparkle = clamp(glints(p, 6.0, 1.1) + 0.7 * glints(p, 10.0, 1.6), 0.0, 1.0) * ring;

  // The halo, then the glints over it.
  float veil = clamp(light * 0.85, 0.0, 1.0);
  vec3 body = mix(uDeep, tint, halo) * veil;
  color = vec4(body * (1.0 - sparkle) + uLight * sparkle, veil * (1.0 - sparkle) + sparkle);
}`;

// Maniac: the most intense, a living fire. Tongues of flame lick out from behind the metal all
// around the Ornament, twisted by a turbulence that climbs, taller above than below, from a hot
// pale core to the brand's orange at their tips. A flickering halo glows behind them, and embers
// rise fast in two layers, swaying and dying as they climb. Premultiplied alpha.
const MANIAC_FRAGMENT = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uLight;
uniform vec3 uMid;
uniform vec3 uDeep;

out vec4 color;
${NOISE}

// Three octaves of noise, each finer and fainter: from 0 to 0.875.
float fbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;

  for (int i = 0; i < 3; i++) {
    sum += amp * noise(p);
    p = p * 2.03 + 11.7;
    amp *= 0.5;
  }

  return sum;
}

// One layer of embers: columns of cells scrolling up faster than Platinum's motes, one ember at
// most per cell, swaying and flickering hard. The larger the scale, the smaller and slower.
float embers(vec2 p, float scale, float rise) {
  vec2 q = p * scale;
  float column = floor(q.x);
  float pace = 0.7 + 0.6 * hash(vec2(column, scale));
  q.y -= uTime * rise * scale * pace;
  vec2 cell = floor(q);
  float seed = hash(cell + scale);
  vec2 spot = vec2(0.5 + 0.3 * sin(uTime * (1.5 + seed) + seed * 30.0), 0.2 + 0.6 * hash(cell + 9.1));
  float d = length(fract(q) - spot);
  float size = 0.05 + 0.05 * seed;
  // A bright core in a soft glow.
  float ember = smoothstep(size, 0.0, d) + 0.4 * pow(smoothstep(size * 3.0, 0.0, d), 2.0);
  float flicker = 0.55 + 0.45 * sin(uTime * (5.0 + 6.0 * seed) + seed * 17.0);

  return ember * flicker * step(0.66, seed);
}

void main() {
  vec2 p = gl_FragCoord.xy / uResolution * 2.0 - 1.0;
  float r = length(p);
  // Fire rises: its tongues reach farther above the Ornament than below it.
  float up = smoothstep(-0.9, 0.9, p.y);

  // A turbulence climbing fast, warped by a slower one, so the tongues twist as they rise.
  float warp = noise(p * 2.0 - vec2(0.0, uTime * 0.6));
  float turb = fbm(vec2(p.x * 3.2, p.y * 2.4 - uTime * 1.6) + warp * 1.2);

  // Each tongue starts behind the metal and ends where the turbulence lets it, always short of
  // the canvas's edge: hottest at its root, cooling to its tip.
  float tip = 0.5 + (0.12 + 0.26 * up) * turb * 1.4;
  float heat = smoothstep(tip, tip - 0.22, r) * smoothstep(0.28, 0.42, r);
  float edge = smoothstep(1.0, 0.85, r);
  float flame = smoothstep(0.0, 0.3, heat) * edge;
  vec3 fire = mix(uDeep, uMid, smoothstep(0.15, 0.55, heat));
  fire = mix(fire, uLight, smoothstep(0.65, 1.0, heat));

  // Behind the flames, a halo that flickers with them.
  float halo = smoothstep(1.0, 0.35, r) * smoothstep(0.2, 0.4, r);
  float flicker = 0.8 + 0.2 * noise(vec2(uTime * 3.0, 0.0));
  float glow = halo * halo * 0.45 * flicker;

  // Born in the fire, the embers rise above it, and die before the canvas's edge.
  float rising = smoothstep(-0.2, 0.3, p.y) * smoothstep(0.3, 0.55, r) * smoothstep(0.98, 0.7, r);
  float spark = clamp(embers(p, 8.0, 0.22) + 0.7 * embers(p, 13.0, 0.16), 0.0, 1.0) * rising;

  // The halo, the flames over it, then the embers over both.
  vec3 body = fire * flame + uDeep * glow * (1.0 - flame);
  float alpha = flame + glow * (1.0 - flame);
  vec3 ember = mix(uMid, uLight, spark) * spark;
  color = vec4(body * (1.0 - spark) + ember, alpha * (1.0 - spark) + spark);
}`;

// Three colours of a Tier's metal, from the sprite's paint rather than the CSS tokens: the Aura
// matches the drawing, and never follows a change of accent.
export type AuraColors = { light: string; mid: string; deep: string };

type FullAuraShader = { fragment: string; colors: AuraColors };

// The metal's lightest, middle and deepest paint: its highlight, its body and its crease.
const metalColors = (tier: FullAuraTier): AuraColors => {
  const { light, mid, crease } = METALS[tier];

  return { light, mid, deep: crease };
};

// One shader for each Tier with a full Aura, none for the others.
const FULL_AURA_SHADERS: Record<FullAuraTier, FullAuraShader> = {
  gold: { fragment: GOLD_FRAGMENT, colors: metalColors("gold") },
  platinum: { fragment: PLATINUM_FRAGMENT, colors: metalColors("platinum") },
  diamond: { fragment: DIAMOND_FRAGMENT, colors: metalColors("diamond") },
  // The sprite's fire rather than its metal: its pale core, its gold, and the Maniac's fixed
  // orange, which never follows a change of accent.
  maniac: { fragment: MANIAC_FRAGMENT, colors: HOT },
};

// The shader of `tier`'s full Aura, or undefined for a Tier without one.
export const fullAuraShader = (tier: Tier): FullAuraShader | undefined =>
  hasFullAura(tier) ? FULL_AURA_SHADERS[tier] : undefined;

// "#rrggbb" as the three channels of a vec3, from 0 to 1.
export const rgb = (hex: string): [number, number, number] => {
  const value = Number.parseInt(hex.slice(1), 16);

  return [((value >> 16) & 0xff) / 255, ((value >> 8) & 0xff) / 255, (value & 0xff) / 255];
};
