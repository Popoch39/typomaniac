import { ProfileHeroRankLines } from "@/components/profile/profile-hero-rank-lines";
import type { RankedPlaceView } from "@/components/ranked/ranked-place-of";
import { TIER_COLORS, TIER_NAMES } from "@/components/tier/tier";

// The rank in words in the hero of `/profile`: its name in its Tier's colour, its TP and how far the
// next (« 42 TP · 58 avant Or I »); Maniac's TP alone; the Placement Duels played.
export const ProfileHeroRankText = ({ place }: { place: RankedPlaceView }) => {
  switch (place.kind) {
    case "division": {
      return (
        <ProfileHeroRankLines
          title={place.name}
          line={`${place.tp} TP · ${place.ahead}`}
          className={TIER_COLORS[place.tier]}
        />
      );
    }

    case "maniac": {
      return (
        <ProfileHeroRankLines
          title={TIER_NAMES.maniac}
          line={`${place.tp} TP`}
          className={TIER_COLORS.maniac}
        />
      );
    }

    case "placement": {
      return (
        <ProfileHeroRankLines title="Placement" line={`${place.played} / ${place.of} Duels`} />
      );
    }

    case "unranked": {
      return null;
    }
  }
};
