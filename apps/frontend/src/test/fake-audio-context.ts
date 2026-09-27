import type {
  FaceOffAudioContext,
  SynthBuffer,
  SynthParam,
  SynthSource,
} from "@/audio/face-off-synth";

// A node of the fake graph: where it sends its sound, and, for a source, when it starts and stops.
type FakeNode = SynthSource & {
  connections: FakeNode[];
  startsAt: number | null;
  stopsAt: number | null;
};

// The kinds a node starts with, as Web Audio's own do: the synth sets its own.
const SINE: OscillatorType = "sine";

const LOWPASS: BiquadFilterType = "lowpass";

const NO_BUFFER: SynthBuffer | null = null;

const fakeParam = (): SynthParam => ({
  value: 0,
  setValueAtTime: () => {},
  exponentialRampToValueAtTime: () => {},
});

// An audio context for the tests: locked until resumed, like a browser's before a gesture. It
// builds no sound, it writes down every node and what each one is connected to.
export const fakeAudioContext = () => {
  const nodes: FakeNode[] = [];

  const node = <T>(parts: T): FakeNode & T => {
    const created: FakeNode & T = {
      ...parts,
      connections: [],
      startsAt: null,
      stopsAt: null,
      connect: (destination: FakeNode) => {
        created.connections.push(destination);

        return destination;
      },
      start: (at: number) => {
        created.startsAt = at;
      },
      stop: (at: number) => {
        created.stopsAt = at;
      },
    };

    nodes.push(created);

    return created;
  };

  const destination = node({});

  const context: FaceOffAudioContext = {
    state: "suspended",
    currentTime: 0,
    sampleRate: 8000,
    destination,
    resume: async () => {
      context.state = "running";
    },
    createGain: () => node({ gain: fakeParam() }),
    createOscillator: () => node({ type: SINE, frequency: fakeParam() }),
    createBiquadFilter: () => node({ type: LOWPASS, frequency: fakeParam(), Q: fakeParam() }),
    createBufferSource: () => node({ buffer: NO_BUFFER }),
    createBuffer: (_channels, length) => {
      const samples = new Float32Array(length);

      return { getChannelData: () => samples };
    },
  };

  // Whether `from` ends up in the speakers.
  const reaches = (from: FakeNode): boolean =>
    from === destination || from.connections.some(reaches);

  return {
    context,
    // The sources started so far, each with whether its sound reaches the speakers.
    started: () =>
      nodes.flatMap((each) =>
        each.startsAt === null
          ? []
          : [{ startsAt: each.startsAt, stopsAt: each.stopsAt, heard: reaches(each) }],
      ),
  };
};
