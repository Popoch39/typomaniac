import { AppFrameLayout } from "@/components/app-frame-layout";
import { DuelHud } from "@/components/duel-hud/duel-hud";
import {
  isOver,
  SCRIPTED_OPPONENT,
  SCRIPTED_SELF,
  scriptedDuel,
  scriptedPlayer,
  typedBy,
} from "@/components/duel-hud-dev/scripted-duel";

// The scripted Duel has no one to forfeit to.
const noForfeit = () => {};

// The real HUD on the Duel's scene, header included, over the whole window, fed with the scripted
// Duel `t` ms after GO. Each Run and Score is replayed only when a Keystroke comes in.
export const DuelHudDevStage = ({ t }: { t: number }) => {
  const ended = isOver(t);
  const self = scriptedPlayer(SCRIPTED_SELF, typedBy(SCRIPTED_SELF, t), ended);
  const opponent = scriptedPlayer(SCRIPTED_OPPONENT, typedBy(SCRIPTED_OPPONENT, t), ended);
  const model = scriptedDuel(self, opponent, t);

  return (
    <div className="fixed inset-0 bg-background">
      <AppFrameLayout duelFormat={{ challenge: model.challenge }}>
        <DuelHud model={model} veil={null} onLeave={noForfeit} />
      </AppFrameLayout>
    </div>
  );
};
