import { SettingsBar } from "@/components/settings/settings-bar";
import { useRunStore } from "@/stores/run-store";

// The settings bar, centred at the top of the page, before the first Keystroke and on the Result;
// gone while the Run is typed so it does not distract. Its room stays taken, so the Text does not
// move when it goes.
export const RunSettings = () => {
  const typing = useRunStore((state) => state.startedAt !== null && state.result === null);

  return <div className="flex min-h-13 justify-center">{typing ? null : <SettingsBar />}</div>;
};
