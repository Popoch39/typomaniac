import { SettingsBar } from "@/components/settings/settings-bar";
import { useRunStore } from "@/stores/run-store";

// The settings bar before the first Keystroke and on the Result, gone while the Run is typed so
// it does not distract. Its room stays taken, so the Text does not move when it goes.
export const RunSettings = () => {
  const typing = useRunStore((state) => state.startedAt !== null && state.result === null);

  return <div className="min-h-7">{typing ? null : <SettingsBar />}</div>;
};
