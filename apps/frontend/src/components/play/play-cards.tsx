import { FriendsDuelCard } from "@/components/play/friends-duel-card";
import { RankedCard } from "@/components/play/ranked-card";
import { TrainingCard } from "@/components/play/training-card";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Jouer's cards, the board « A · Affiche »: the Training, the Ranked (wider, in the accent) and the
// Duel with a Friend, side by side on the page's height, for a Visitor as for a User.
export const PlayCards = () => {
  const locale = useLocale();

  return (
    <>
      <h1
        data-intro="part"
        data-search-leaves
        className="text-[44px] leading-tight font-extrabold tracking-[-0.03em]"
      >
        {m.play_cards_title({}, { locale })}
      </h1>
      <div className="flex min-h-0 flex-1 gap-6">
        <TrainingCard />
        <RankedCard />
        <FriendsDuelCard />
      </div>
    </>
  );
};
