import { useQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { RoundBreakCount } from "@/components/round-break/round-break-count";
import { RoundBreakPlayer } from "@/components/round-break/round-break-player";
import type { RoundCount } from "@/components/round-break/round-break-view";
import { atHandle } from "@/lib/at-handle";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import type { DuelPlay } from "@/stores/duel-store";

// The Round break's header, as the board draws it: both avatars, and the count of the Rounds won
// between them. The HUD's band comes into it, and goes back out of it at GO (`data-round-head`).
export const RoundBreakHead = ({
  duel,
  count,
}: {
  duel: Pick<DuelPlay, "selfOrnament" | "opponent">;
  count: RoundCount;
}) => {
  const locale = useLocale();
  const { data: me } = useQuery(meQueryOptions);

  return (
    <div data-rb="head" data-round-head className="flex items-center justify-center gap-[26px]">
      <RoundBreakPlayer
        name={m.duel_self({}, { locale })}
        handle={me?.handle ?? null}
        image={me?.image ?? null}
        ornament={duel.selfOrnament}
        mirrored={false}
      />
      <RoundBreakCount count={count} />
      <RoundBreakPlayer
        name={atHandle(duel.opponent.handle)}
        handle={duel.opponent.handle}
        image={duel.opponent.image}
        ornament={duel.opponent.ornament}
        mirrored
      />
    </div>
  );
};
