import { gsap } from "gsap";
import type { Tier } from "ranked";

import { hasFullAura } from "@/components/aura/aura-paint";
import type { FullAuraRuntime } from "@/lib/aura-runtime";
import { FULL_AURA_SHADERS, QUAD_VERTEX, rgb } from "@/lib/full-aura-shaders";
import {
  type FrameClock,
  type FullAuraPainter,
  openFullAuraRuntime,
} from "@/lib/full-aura-runtime";

// Loaded on demand only, the first time a full Aura is asked for: none of the WebGL code is in
// the first chunk.

const CONTEXT: WebGLContextAttributes = {
  alpha: true,
  premultipliedAlpha: true,
  antialias: false,
  depth: false,
  stencil: false,
  powerPreference: "low-power",
};

const compile = (gl: WebGL2RenderingContext, type: GLenum, source: string) => {
  const shader = gl.createShader(type);

  if (shader === null) {
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  return shader;
};

// The program of one Tier's Aura, or null if it does not build.
const link = (gl: WebGL2RenderingContext, fragment: string) => {
  const vertexShader = compile(gl, gl.VERTEX_SHADER, QUAD_VERTEX);
  const fragmentShader = compile(gl, gl.FRAGMENT_SHADER, fragment);
  const program = gl.createProgram();

  if (vertexShader === null || fragmentShader === null) {
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (gl.getProgramParameter(program, gl.LINK_STATUS) !== true) {
    gl.deleteProgram(program);

    return null;
  }

  return program;
};

// Gives the context back to the browser now, rather than whenever it collects the canvas. A
// context the driver already lost has nothing to give back.
const releaseContext = (gl: WebGL2RenderingContext) => {
  if (!gl.isContextLost()) {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
};

// A WebGL2 painter on `canvas` for `tier`'s Aura: null without WebGL2, without a shader for that
// Tier, or if it does not build.
const openWebGl2Painter = (
  canvas: HTMLCanvasElement,
  tier: Tier,
  onLost: () => void,
): FullAuraPainter | null => {
  const shader = hasFullAura(tier) ? FULL_AURA_SHADERS[tier] : undefined;
  const gl = shader === undefined ? null : canvas.getContext("webgl2", CONTEXT);

  if (shader === undefined || gl === null) {
    return null;
  }

  const program = link(gl, shader.fragment);

  if (program === null) {
    releaseContext(gl);

    return null;
  }

  const time = gl.getUniformLocation(program, "uTime");
  const resolution = gl.getUniformLocation(program, "uResolution");

  gl.useProgram(program);
  gl.uniform3fv(gl.getUniformLocation(program, "uLight"), rgb(shader.colors.light));
  gl.uniform3fv(gl.getUniformLocation(program, "uMid"), rgb(shader.colors.mid));
  gl.uniform3fv(gl.getUniformLocation(program, "uDeep"), rgb(shader.colors.deep));
  gl.clearColor(0, 0, 0, 0);

  const lost = () => onLost();

  canvas.addEventListener("webglcontextlost", lost);

  return {
    draw: (seconds) => {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.uniform2f(resolution, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.uniform1f(time, seconds);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    dispose: () => {
      // Not a loss: it was released.
      canvas.removeEventListener("webglcontextlost", lost);

      if (!gl.isContextLost()) {
        gl.deleteProgram(program);
      }

      releaseContext(gl);
    },
  };
};

// GSAP's ticker, the one clock of every animation in the app, until stopped.
const tickerFrames: FrameClock = (onFrame) => {
  const tick = (time: number) => onFrame(time);

  gsap.ticker.add(tick);

  return () => gsap.ticker.remove(tick);
};

export const browserFullAuraRuntime = (): FullAuraRuntime =>
  openFullAuraRuntime({
    open: openWebGl2Painter,
    frames: tickerFrames,
    pixelRatio: () => window.devicePixelRatio,
  });
