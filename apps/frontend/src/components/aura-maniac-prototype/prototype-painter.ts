import { HOT, METALS } from "@/components/tier/sprite/tier-sprite-paint";
import { MAX_WAVES } from "@/components/aura-maniac-prototype/keystroke-prototype";
import { PROTOTYPE_FRAGMENT } from "@/components/aura-maniac-prototype/prototype-shader";
import { QUAD_VERTEX, rgb } from "@/lib/full-aura-shaders";

// PROTOTYPE, throwaway: a WebGL2 painter of the keystroke waves on one canvas, its own context,
// outside the Aura's runtime.

export type WaveUniforms = {
  ages: readonly number[];
  flash: number;
  birth: number;
  reach: number;
  curve: number;
  thickness: number;
  trail: number;
  halo: number;
  flashGain: number;
};

const compile = (gl: WebGL2RenderingContext, type: GLenum, source: string) => {
  const shader = gl.createShader(type);

  if (shader === null) {
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) !== true) {
    console.error(gl.getShaderInfoLog(shader));
  }

  return shader;
};

export const openPrototypePainter = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, antialias: false });

  if (gl === null) {
    return null;
  }

  const vertex = compile(gl, gl.VERTEX_SHADER, QUAD_VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, PROTOTYPE_FRAGMENT);

  if (vertex === null || fragment === null) {
    return null;
  }

  const program = gl.createProgram();

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.useProgram(program);

  const at = (name: string) => gl.getUniformLocation(program, name);

  gl.uniform3fv(at("uLight"), rgb(HOT.light));
  gl.uniform3fv(at("uMid"), rgb(METALS.maniac.mid));
  gl.uniform3fv(at("uDeep"), rgb(METALS.maniac.crease));
  gl.clearColor(0, 0, 0, 0);

  const resolution = at("uResolution");
  const waves = at("uWaves");
  const flash = at("uFlash");
  const birth = at("uBirth");
  const reach = at("uReach");
  const curve = at("uCurve");
  const thickness = at("uThickness");
  const trail = at("uTrail");
  const halo = at("uHalo");
  const flashGain = at("uFlashGain");
  const ages = new Float32Array(MAX_WAVES);

  return {
    draw: (uniforms: WaveUniforms) => {
      const ratio = Math.min(window.devicePixelRatio, 1.5);
      const width = Math.round(canvas.clientWidth * ratio);
      const height = Math.round(canvas.clientHeight * ratio);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ages.set(uniforms.ages);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.uniform2f(resolution, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.uniform1fv(waves, ages);
      gl.uniform1f(flash, uniforms.flash);
      gl.uniform1f(birth, uniforms.birth);
      gl.uniform1f(reach, uniforms.reach);
      gl.uniform1f(curve, uniforms.curve);
      gl.uniform1f(thickness, uniforms.thickness);
      gl.uniform1f(trail, uniforms.trail);
      gl.uniform1f(halo, uniforms.halo);
      gl.uniform1f(flashGain, uniforms.flashGain);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    // The context stays: a canvas hands the same one back when remounted (StrictMode), lost for
    // good if it were given back.
    dispose: () => gl.deleteProgram(program),
  };
};
