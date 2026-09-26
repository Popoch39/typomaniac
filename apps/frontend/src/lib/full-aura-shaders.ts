import type { Tier } from "ranked";

import { type FullAuraTier, hasFullAura } from "@/components/aura/aura-paint";
import { METALS } from "@/components/tier/tier-sprite-paint";

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

// Or: a warm halo from the metal of Or, breathing, its light stirring slowly around the Ornament,
// and a few glints that twinkle in it. Premultiplied alpha.
const OR_FRAGMENT = `#version 300 es
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

// Platine: a cool halo from the metal of Platine, fuller than Or's, its light drifting upward in
// plumes, and motes of light rising gently in three layers from behind the drawing, each wobbling
// and flickering on its own beat, fading out as they climb. Premultiplied alpha.
const PLATINE_FRAGMENT = `#version 300 es
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

  // Wider than Or's, strongest through the metal, gone at the canvas's edge.
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
  or: { fragment: OR_FRAGMENT, colors: metalColors("or") },
  platine: { fragment: PLATINE_FRAGMENT, colors: metalColors("platine") },
};

// The shader of `tier`'s full Aura, or undefined for a Tier without one.
export const fullAuraShader = (tier: Tier): FullAuraShader | undefined =>
  hasFullAura(tier) ? FULL_AURA_SHADERS[tier] : undefined;

// "#rrggbb" as the three channels of a vec3, from 0 to 1.
export const rgb = (hex: string): [number, number, number] => {
  const value = Number.parseInt(hex.slice(1), 16);

  return [((value >> 16) & 0xff) / 255, ((value >> 8) & 0xff) / 255, (value & 0xff) / 255];
};
