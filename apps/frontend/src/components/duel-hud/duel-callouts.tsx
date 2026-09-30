import { DuelConnection } from "@/components/duel/duel-connection";
import { DuelCallout } from "@/components/duel-hud/duel-callout";
import { DuelEndCallout } from "@/components/duel-hud/duel-end-callout";
import { type DuelHudModel, isTimeUp } from "@/components/duel-hud/duel-hud-model";
import { calloutKey, useCalloutAt } from "@/components/duel-hud/use-callout-at";
import { atHandle } from "@/lib/at-handle";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The room under the band where the HUD announces the Callouts, one at a time, each on its frame,
// read politely by screen readers, then the end once the time is up. A lost connection, this
// tab's or the opponent's, takes it over while it lasts.
export const DuelCallouts = ({ model }: { model: DuelHudModel }) => {
  const { self, opponent, startsAt } = model;
  const locale = useLocale();
  const lost = !self.connected || !opponent.connected;
  const callout = useCalloutAt(model);

  return (
    <output
      aria-live="polite"
      aria-label={m.hud_callouts({}, { locale })}
      className="mt-3 flex h-12 items-center justify-center"
    >
      {lost ? (
        <DuelConnection
          lost={self.connected ? "opponent" : "self"}
          opponent={atHandle(opponent.handle)}
        />
      ) : null}
      {lost || !isTimeUp(model) ? null : <DuelEndCallout />}
      {lost || callout === null ? null : (
        <DuelCallout key={calloutKey(callout)} callout={callout} startsAt={startsAt} />
      )}
    </output>
  );
};
