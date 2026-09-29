import { PLACEMENT_DUELS } from "ranked";

import { RankedPlaceBar } from "@/components/ranked/ranked-place-bar";
import { RankedPlaceLine } from "@/components/ranked/ranked-place-line";
import type { RankedPlaceView } from "@/components/ranked/ranked-place-of";
import { RankedPlaceTitle } from "@/components/ranked/ranked-place-title";
import { divisionMeterText, placementMeterText } from "@/components/tier/rank/tp-meter-text";
import { TIER_COLORS, TIER_NAMES } from "@/components/tier/tier";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// What « Ta place » says for each place: the rank and its bar in a Division, the TP alone in
// Maniac, the Placement Duels played, or what gets the reader in.
export const RankedPlaceBody = ({ place }: { place: RankedPlaceView }) => {
  const locale = useLocale();
  const numbers = numberFormat(locale);

  switch (place.kind) {
    case "division": {
      const tp = numbers.format(place.tp);

      return (
        <>
          <RankedPlaceTitle className={TIER_COLORS[place.tier]}>{place.name}</RankedPlaceTitle>
          <RankedPlaceLine value={m.rank_tp({ tp }, { locale })} aside={place.ahead} />
          <RankedPlaceBar
            label={m.tp_progress_division_label({}, { locale })}
            value={place.tp}
            of={place.of}
            valueText={divisionMeterText(place.tp, place.of, place.ahead, locale)}
            className={TIER_COLORS[place.tier]}
          />
        </>
      );
    }

    case "maniac": {
      return (
        <>
          <RankedPlaceTitle className={TIER_COLORS.maniac}>{TIER_NAMES.maniac}</RankedPlaceTitle>
          <RankedPlaceLine
            value={m.rank_tp({ tp: numbers.format(place.tp) }, { locale })}
            aside={m.ranked_place_no_ceiling({}, { locale })}
          />
        </>
      );
    }

    case "placement": {
      const played = numbers.format(place.played);
      const of = numbers.format(place.of);

      return (
        <>
          <RankedPlaceTitle>{m.ranked_place_placement({}, { locale })}</RankedPlaceTitle>
          <RankedPlaceLine
            value={m.ranked_place_placement_played({ played, of }, { locale })}
            aside={m.ranked_place_placement_then({}, { locale })}
          />
          <RankedPlaceBar
            label={m.tp_progress_placement_label({}, { locale })}
            value={place.played}
            of={place.of}
            valueText={placementMeterText(place.played, place.of, locale)}
            className="text-foreground"
          />
        </>
      );
    }

    case "unranked": {
      return (
        <>
          <RankedPlaceTitle>{m.ranked_place_unranked({}, { locale })}</RankedPlaceTitle>
          <RankedPlaceLine
            value={m.ranked_place_unranked_duels(
              { count: PLACEMENT_DUELS, shown: numbers.format(PLACEMENT_DUELS) },
              { locale },
            )}
            aside={m.ranked_place_unranked_then({}, { locale })}
          />
        </>
      );
    }
  }
};
