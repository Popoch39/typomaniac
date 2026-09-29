import { PlayFadePage } from "@/components/play/play-fade-page";
import { PLAY_PATH } from "@/components/play/play-paths";
import { RunScreen } from "@/components/run/run-screen";

// The Run's own page: fades in from Jouer's cards, where Précédent leads back. Opened directly, a
// Run ready to type.
export const RunPage = () => (
  <PlayFadePage from={PLAY_PATH} className="gap-4">
    <RunScreen />
  </PlayFadePage>
);
