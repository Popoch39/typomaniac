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
import { type Clock, ClockContext } from "@/components/run/clock-context";

// The scripted Duel has no one to forfeit to.
const noForfeit = () => {};

type DuelHudDevStageProps = {
  t: number;
  // The scripted Duel's clock, GO at 0: what the HUD's timelines are sought to.
  clock: Clock;
};

// The real HUD on the Duel's scene, header included, over the whole window, fed with the scripted
// Duel `t` ms after GO, on its clock. Each Run and Score is replayed only when a Keystroke comes
// in.
export const DuelHudDevStage = ({ t, clock }: DuelHudDevStageProps) => {
  const ended = isOver(t);
  const self = scriptedPlayer(SCRIPTED_SELF, typedBy(SCRIPTED_SELF, t), ended);
  const opponent = scriptedPlayer(SCRIPTED_OPPONENT, typedBy(SCRIPTED_OPPONENT, t), ended);
  const model = scriptedDuel(self, opponent, t);

  return (
    <div className="fixed inset-0 bg-background">
      <AppFrameLayout duelFormat={{ challenge: model.challenge }} soloTyping={false}>
        <ClockContext value={clock}>
          <DuelHud model={model} veil={null} onLeave={noForfeit} />
        </ClockContext>
      </AppFrameLayout>
    </div>
  );
};
