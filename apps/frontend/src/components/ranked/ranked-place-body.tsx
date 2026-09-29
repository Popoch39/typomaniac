import { PLACEMENT_DUELS } from "ranked";

import { RankedPlaceBar } from "@/components/ranked/ranked-place-bar";
import { RankedPlaceLine } from "@/components/ranked/ranked-place-line";
import type { RankedPlace } from "@/components/ranked/ranked-place-of";
import { RankedPlaceTitle } from "@/components/ranked/ranked-place-title";
import { TIER_COLORS, TIER_NAMES } from "@/components/tier/tier";

// What « Ta place » says for each place: the rank and its bar in a Division, the TP alone in
// Maniac, the Placement Duels played, or what gets the reader in.
export const RankedPlaceBody = ({ place }: { place: RankedPlace }) => {
  switch (place.kind) {
    case "division": {
      return (
        <>
          <RankedPlaceTitle className={TIER_COLORS[place.tier]}>{place.name}</RankedPlaceTitle>
          <RankedPlaceLine value={`${place.tp} TP`} aside={place.ahead} />
          <RankedPlaceBar
            label="TP de la Division"
            value={place.tp}
            of={place.of}
            valueText={`${place.tp} TP sur ${place.of} · ${place.ahead}`}
            className={TIER_COLORS[place.tier]}
          />
        </>
      );
    }

    case "maniac": {
      return (
        <>
          <RankedPlaceTitle className={TIER_COLORS.maniac}>{TIER_NAMES.maniac}</RankedPlaceTitle>
          <RankedPlaceLine value={`${place.tp} TP`} aside="sans plafond" />
        </>
      );
    }

    case "placement": {
      return (
        <>
          <RankedPlaceTitle>Placement</RankedPlaceTitle>
          <RankedPlaceLine value={`${place.played} / ${place.of} Duels`} aside="puis ton rang" />
          <RankedPlaceBar
            label="Placement"
            value={place.played}
            of={place.of}
            valueText={`${place.played} Duels de Placement joués sur ${place.of}`}
            className="text-foreground"
          />
        </>
      );
    }

    case "unranked": {
      return (
        <>
          <RankedPlaceTitle>Non classé</RankedPlaceTitle>
          <RankedPlaceLine value={`${PLACEMENT_DUELS} Duels de Placement`} aside="pour entrer" />
        </>
      );
    }
  }
};
