import type { Tier } from "ranked";

import { MAX_WAVES } from "@/components/aura-maniac-prototype/keystroke-prototype";
import { PROTOTYPE_FRAGMENT } from "@/components/aura-maniac-prototype/prototype-shader";
import { fullAuraShader, QUAD_VERTEX } from "@/lib/full-aura-shaders";

// PROTOTYPE, throwaway: the GPU time of one frame of each full Aura's shader, measured by a timer
// query on a detached 1024 × 1024 canvas: the fragment shader's own cost, whatever the screen's
// refresh rate.

const SIZE = 1024;

const DRAWS = 60;

const RUNS = 5;

export type BenchResult = { name: string; msPerFrame: number | null };

type Bench = {
  name: string;
  fragment: string;
  prepare: (gl: WebGL2RenderingContext, program: WebGLProgram) => void;
};

const program = (gl: WebGL2RenderingContext, fragment: string) => {
  const built = gl.createProgram();

  for (const [type, source] of [
    [gl.VERTEX_SHADER, QUAD_VERTEX],
    [gl.FRAGMENT_SHADER, fragment],
  ] as const) {
    const shader = gl.createShader(type);

    if (shader !== null) {
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      gl.attachShader(built, shader);
    }
  }

  gl.linkProgram(built);

  return built;
};

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

// Resolves once the GPU has answered `query`.
const settled = (gl: WebGL2RenderingContext, query: WebGLQuery): Promise<void> =>
  gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE) === true
    ? Promise.resolve()
    : frame().then(() => settled(gl, query));

const tierBench = (tier: Tier, name: string): Bench[] => {
  const shader = fullAuraShader(tier);

  return shader === undefined
    ? []
    : [
        {
          name,
          fragment: shader.fragment,
          prepare: (gl, built) => {
            gl.uniform3f(gl.getUniformLocation(built, "uLight"), 1, 1, 1);
            gl.uniform3f(gl.getUniformLocation(built, "uMid"), 1, 0.5, 0.4);
            gl.uniform3f(gl.getUniformLocation(built, "uDeep"), 0.6, 0.3, 0.3);
            gl.uniform1f(gl.getUniformLocation(built, "uTime"), 12.3);
          },
        },
      ];
};

// The new waves at their worst: every slot in flight.
const wavesBench: Bench = {
  name: "Maniac, ondes de frappe (6 ondes)",
  fragment: PROTOTYPE_FRAGMENT,
  prepare: (gl, built) => {
    const at = (uniform: string) => gl.getUniformLocation(built, uniform);

    gl.uniform1fv(
      at("uWaves"),
      Float32Array.from({ length: MAX_WAVES }, (_, index) => index / MAX_WAVES),
    );
    gl.uniform1f(at("uFlash"), 0.5);
    gl.uniform1f(at("uBirth"), 0.42);
    gl.uniform1f(at("uReach"), 0.97);
    gl.uniform1f(at("uCurve"), 2);
    gl.uniform1f(at("uThickness"), 0.018);
    gl.uniform1f(at("uTrail"), 0.15);
    gl.uniform1f(at("uHalo"), 0.35);
    gl.uniform1f(at("uFlashGain"), 0.6);
  },
};

export const benchFullAuras = async (): Promise<BenchResult[]> => {
  const canvas = document.createElement("canvas");

  canvas.width = SIZE;
  canvas.height = SIZE;

  const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, antialias: false });
  const timer = gl?.getExtension("EXT_disjoint_timer_query_webgl2");

  const benches = [
    ...tierBench("gold", "Gold"),
    ...tierBench("platinum", "Platinum"),
    ...tierBench("diamond", "Diamond"),
    ...tierBench("maniac", "Maniac, le feu actuel"),
    wavesBench,
  ];

  if (gl === null || gl === undefined || timer === null || timer === undefined) {
    return benches.map(({ name }) => ({ name, msPerFrame: null }));
  }

  gl.viewport(0, 0, SIZE, SIZE);

  // Every run of every shader queued at once, one query each, read once the GPU has answered all.
  const queued = benches.map((bench) => {
    const built = program(gl, bench.fragment);

    gl.useProgram(built);
    gl.uniform2f(gl.getUniformLocation(built, "uResolution"), SIZE, SIZE);
    bench.prepare(gl, built);

    const queries = Array.from({ length: RUNS }, () => {
      const query = gl.createQuery();

      gl.beginQuery(timer.TIME_ELAPSED_EXT, query);

      for (let draw = 0; draw < DRAWS; draw += 1) {
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }

      gl.endQuery(timer.TIME_ELAPSED_EXT);

      return query;
    });

    gl.deleteProgram(built);

    return { name: bench.name, queries };
  });

  await Promise.all(queued.flatMap(({ queries }) => queries.map((query) => settled(gl, query))));

  const disjoint = gl.getParameter(timer.GPU_DISJOINT_EXT) === true;

  const results = queued.map(({ name, queries }) => {
    const runs = queries
      .map((query): number => gl.getQueryParameter(query, gl.QUERY_RESULT) / DRAWS / 1e6)
      .toSorted((a, b) => a - b);

    return { name, msPerFrame: disjoint ? null : (runs[Math.floor(runs.length / 2)] ?? null) };
  });

  gl.getExtension("WEBGL_lose_context")?.loseContext();

  return results;
};
