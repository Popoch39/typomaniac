import { describe, expect, test } from "vitest";

import { openFaceOffSounds, TIER_UP_SOUNDS } from "@/audio/face-off-sounds";
import { fakeAudioContext } from "@/test/fake-audio-context";

// The Face-off's sounds on a fake context, unlocked as by a click.
const unlocked = async () => {
  const audio = fakeAudioContext();
  const sounds = openFaceOffSounds(() => audio.context);

  sounds.unlock();
  await audio.context.resume();

  return { audio, sounds };
};

describe("openFaceOffSounds", () => {
  test.each(TIER_UP_SOUNDS)("%s plays a sound that reaches the speakers", async (sound) => {
    const { audio, sounds } = await unlocked();

    sounds.play(sound);

    const started = audio.started();

    expect(started).not.toHaveLength(0);
    expect(started.every((source) => source.heard)).toBe(true);
    expect(started.every((source) => (source.stopsAt ?? 0) > source.startsAt)).toBe(true);
  });

  test("drops a sound while the audio is still locked", () => {
    const audio = fakeAudioContext();
    const sounds = openFaceOffSounds(() => audio.context);

    sounds.play("tier-up-bronze-impact");

    expect(audio.started()).toEqual([]);
  });

  test("stays silent when the browser refuses an audio context", () => {
    const sounds = openFaceOffSounds(() => {
      throw new Error("no audio");
    });

    expect(() => {
      sounds.unlock();
      sounds.play("tier-up-bronze-impact");
    }).not.toThrow();
  });
});
