import { ProfileHeroRankLines } from "@/components/profile/profile-hero-rank-lines";
import type { RankedPlaceView } from "@/components/ranked/ranked-place-of";
import { TIER_COLORS, TIER_NAMES } from "@/components/tier/tier";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The rank in words in the hero of `/profile`: its name in its Tier's colour, its TP and how far the
// next (« 42 TP · 58 avant Gold I »); Maniac's TP alone; the Placement Duels played.
export const ProfileHeroRankText = ({ place }: { place: RankedPlaceView }) => {
  const locale = useLocale();
  const numbers = numberFormat(locale);

  switch (place.kind) {
    case "division": {
      return (
        <ProfileHeroRankLines
          title={place.name}
          line={m.profile_hero_rank_line(
            { tp: numbers.format(place.tp), ahead: place.ahead },
            { locale },
          )}
          className={TIER_COLORS[place.tier]}
        />
      );
    }

    case "maniac": {
      return (
        <ProfileHeroRankLines
          title={TIER_NAMES.maniac}
          line={m.rank_tp({ tp: numbers.format(place.tp) }, { locale })}
          className={TIER_COLORS.maniac}
        />
      );
    }

    case "placement": {
      return (
        <ProfileHeroRankLines
          title={m.ranked_place_placement({}, { locale })}
          line={m.ranked_place_placement_played(
            { played: numbers.format(place.played), of: numbers.format(place.of) },
            { locale },
          )}
        />
      );
    }

    case "unranked": {
      return null;
    }
  }
};
