import { useRef } from "react";

import { bandEffects } from "@/components/duel-hud/band-effects";
import { bandLabel, bandSplit } from "@/components/duel-hud/band-lead";
import { DuelBandFill } from "@/components/duel-hud/duel-band-fill";
import { DuelBandHalf } from "@/components/duel-hud/duel-band-half";
import { type DuelHudModel, isTimeUp } from "@/components/duel-hud/duel-hud-model";
import { DuelDisc } from "@/components/duel-hud/duel-disc";
import { useBandSplit } from "@/components/duel-hud/use-band-split";
import { atHandle } from "@/lib/at-handle";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The top of the HUD, as the board B2 · Affiche draws it: a poster in two colours, this User's
// accent and the opponent's blue, split on a slant that slides with the Lead. Each player's half
// in ink over it, mirrored for the opponent, with the effects of their words, the disc of the
// time in the middle.
export const DuelBand = ({ model }: { model: DuelHudModel }) => {
  const bandRef = useRef<HTMLElement>(null);
  const locale = useLocale();
  const { self, opponent, elapsed, startsAt } = model;
  const lead = self.score.score - opponent.score.score;
  const ended = isTimeUp(model);

  useBandSplit(bandRef, bandSplit(lead));

  return (
    <section
      ref={bandRef}
      aria-label={bandLabel(lead, opponent.handle, locale)}
      data-duel-band
      className="relative h-28 overflow-hidden rounded-card bg-opponent"
    >
      <DuelBandFill handle={opponent.handle} mirrored />
      <DuelBandFill handle={self.handle} mirrored={false} />
      <DuelBandHalf
        name={m.duel_self({}, { locale })}
        handle={self.handle}
        score={self.score}
        effects={bandEffects(self.cues, elapsed, ended)}
        startsAt={startsAt}
        mirrored={false}
      />
      <DuelDisc
        startsAt={startsAt}
        seconds={model.seconds}
        elapsed={elapsed}
        over={ended}
        lead={lead}
      />
      <DuelBandHalf
        name={atHandle(opponent.handle)}
        handle={opponent.handle}
        score={opponent.score}
        effects={bandEffects(opponent.cues, elapsed, ended)}
        startsAt={startsAt}
        mirrored
      />
    </section>
  );
};
