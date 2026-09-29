import type { TrainingPreset } from "@/components/play/training-presets";
import { useRunStore } from "@/stores/run-store";
import { useSettingsStore } from "@/stores/settings-store";

// Sets the Run's settings to a preset, kept for the Runs after it as any setting chosen: a new
// Run follows (run-store). Settings already the preset's draw a new Run too, rather than go back
// to one left typed: the Run opened is always ready to type.
export const useChoosePreset = () => {
  const setMode = useSettingsStore((state) => state.setMode);
  const setSeconds = useSettingsStore((state) => state.setSeconds);
  const setWords = useSettingsStore((state) => state.setWords);

  return (preset: TrainingPreset) => {
    const runNumber = useRunStore.getState().runNumber;

    setMode(preset.mode);

    if (preset.mode === "time") {
      setSeconds(preset.seconds);
    } else {
      setWords(preset.words);
    }

    if (useRunStore.getState().runNumber === runNumber) {
      useRunStore.getState().next();
    }
  };
};
