import { RunSettings } from "@/components/run/run-settings";
import { SoloArea } from "@/components/run/solo-area";
import { useSendFinishedRuns } from "@/components/run/use-send-finished-runs";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The Run's screen: its settings at the top, then the Run in the room left, ready to type. Each
// Run a User finishes leaves for their Best Run.
export const RunScreen = () => {
  const locale = useLocale();

  useSendFinishedRuns();

  return (
    <>
      <h1 className="sr-only">{m.run_title({}, { locale })}</h1>
      <RunSettings />
      <SoloArea />
    </>
  );
};
