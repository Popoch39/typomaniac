import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { createAudioEngine } from "@/audio/audio-engine";
import { previewSound, startSoundReactor } from "@/audio/sound-reactor";
import { SoundPreviewContext } from "@/components/sound/sound-preview-context";
import { SoundSetting } from "@/components/sound/sound-setting";
import { useSoundStore } from "@/stores/sound-store";
import { decoded, fakeOutput, key07, middle } from "@/test/fake-audio-output";

const storageKey = "typomaniac-sound";

let stop = () => {};

// Every test starts on a first visit: nothing stored, default sound settings.
beforeEach(() => {
  localStorage.clear();
  useSoundStore.setState(useSoundStore.getInitialState());
});

afterEach(() => {
  stop();
});

// Renders the speaker on one audio engine, the way the app does: the reactor plays the keys, the
// picker previews the packs.
const renderSetting = async () => {
  const fake = fakeOutput();
  const engine = createAudioEngine(() => fake.output);

  stop = startSoundReactor(engine, { random: middle });
  render(
    <SoundPreviewContext value={(choice) => previewSound(engine, choice, middle)}>
      <SoundSetting />
    </SoundPreviewContext>,
  );
  await decoded();

  return { ...fake, user: userEvent.setup() };
};

// The slider hides its thumb until it has measured its track, which happy-dom never lays out: its
// name is not computed then, so it is found by its label instead.
const volumeSlider = () => screen.getByLabelText("Volume", { selector: "input[type=range]" });

// Reloads the page: the store starts over from its defaults, then reads what is stored. Resetting
// the store writes its defaults down, so what was stored is put back first.
const reload = async () => {
  const stored = localStorage.getItem(storageKey);

  useSoundStore.setState(useSoundStore.getInitialState());

  if (stored !== null) {
    localStorage.setItem(storageKey, stored);
  }

  await useSoundStore.persist.rehydrate();
};

// Reloads the page, renders the speaker again and opens the picker.
const reopen = async () => {
  cleanup();
  stop();
  await reload();

  const rendered = await renderSetting();

  await rendered.user.click(screen.getByRole("button", { name: /^Son/ }));

  return rendered;
};

describe("sound picker", () => {
  test("the speaker opens the Sound packs and off, hovering a pack plays one of its keys", async () => {
    const { user, played } = await renderSetting();

    await user.click(screen.getByRole("button", { name: "Son" }));

    expect(screen.getByRole("radio", { name: "Tactile" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "off" })).not.toBeChecked();

    await user.hover(screen.getByText("Tactile"));
    await decoded();

    expect(played).toEqual([key07]);

    await user.hover(screen.getByText("off"));
    await decoded();

    expect(played).toEqual([key07]);
  });

  test("off, chosen with the mouse, crosses out the speaker; a pack chosen plays one of its keys", async () => {
    const { user, played } = await renderSetting();

    await user.click(screen.getByRole("button", { name: "Son" }));
    await user.click(screen.getByRole("radio", { name: "off" }));

    expect(screen.getByRole("radio", { name: "off" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Son coupé" })).toBeInTheDocument();

    played.length = 0;
    await user.click(screen.getByRole("radio", { name: "Tactile" }));
    await decoded();

    expect(screen.getByRole("radio", { name: "Tactile" })).toBeChecked();
    expect(played).toContainEqual(key07);
    expect(screen.getByRole("button", { name: "Son" })).toBeInTheDocument();
  });

  test("the arrow keys choose a pack or off", async () => {
    const { user } = await renderSetting();

    await user.click(screen.getByRole("button", { name: "Son" }));
    screen.getByRole("radio", { name: "Tactile" }).focus();
    await user.keyboard("{ArrowDown}");

    expect(screen.getByRole("radio", { name: "off" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Son coupé" })).toBeInTheDocument();
  });

  test("the slider sets the volume of every sound", async () => {
    const { user, state } = await renderSetting();

    await user.click(screen.getByRole("button", { name: "Son" }));
    volumeSlider().focus();
    await user.keyboard("{ArrowRight}");

    expect(state.volume).toBeCloseTo(0.55);
  });

  test("the pack and the volume survive a reload", async () => {
    const { user } = await renderSetting();

    await user.click(screen.getByRole("button", { name: "Son" }));
    await user.click(screen.getByRole("radio", { name: "off" }));
    volumeSlider().focus();
    await user.keyboard("{ArrowLeft}");
    await reopen();

    expect(screen.getByRole("radio", { name: "off" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Son coupé" })).toBeInTheDocument();
    expect(volumeSlider()).toHaveAttribute("aria-valuenow", "0.45");
  });

  test.each([
    ["an unknown pack", { pack: "typewriter", volume: 0.2 }],
    ["a volume out of range", { pack: "off", volume: 2 }],
    ["a missing field", { pack: "off" }],
  ])("%s stored gives the defaults back", async (_, state) => {
    localStorage.setItem(storageKey, JSON.stringify({ state, version: 1 }));
    const reloaded = await reopen();

    expect(screen.getByRole("radio", { name: "Tactile" })).toBeChecked();
    expect(volumeSlider()).toHaveAttribute("aria-valuenow", "0.5");
    expect(reloaded.state.volume).toBe(0.5);
  });
});
