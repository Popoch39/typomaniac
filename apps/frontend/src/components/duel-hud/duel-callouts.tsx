import { DuelConnection } from "@/components/duel/duel-connection";
import { calloutAt } from "@/components/duel-hud/callouts";
import { DuelCallout } from "@/components/duel-hud/duel-callout";
import type { DuelHudModel } from "@/components/duel-hud/duel-hud-model";
import { atHandle } from "@/lib/at-handle";

// The room under the band where the HUD announces the Callouts, one at a time, read politely by
// screen readers. A lost connection, this tab's or the opponent's, takes it over while it lasts.
export const DuelCallouts = ({ model }: { model: DuelHudModel }) => {
  const { self, opponent, startsAt } = model;
  const lost = !self.connected || !opponent.connected;
  const callout = calloutAt(model);

  return (
    <output
      aria-live="polite"
      aria-label="Callouts"
      className="mt-3 flex h-12 items-center justify-center"
    >
      {lost ? (
        <DuelConnection
          lost={self.connected ? "opponent" : "self"}
          opponent={atHandle(opponent.handle)}
        />
      ) : null}
      {lost || callout === null ? null : (
        <DuelCallout
          key={`${callout.at}:${callout.text}:${callout.value}`}
          callout={callout}
          startsAt={startsAt}
        />
      )}
    </output>
  );
};
