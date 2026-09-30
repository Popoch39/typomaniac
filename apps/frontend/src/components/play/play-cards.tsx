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
      {/* No height of its own (a 0 px basis): the rest of the window, 34rem at least, the height
          left by a 720 px one. Below, the page scrolls. */}
      <div className="flex min-h-[34rem] flex-[1_1_0px] gap-6">
        <TrainingCard />
        <RankedCard />
        <FriendsDuelCard />
      </div>
    </>
  );
};
