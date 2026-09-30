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
      {/* No height of its own (a 0 px basis, no floor): the rest of the main, under the title, with
          the sidebar unfolded as in its Rail. Its cards are size containers, so what fills them
          never pushes the page past the window: they give up blocks instead. */}
      <div className="flex min-h-0 flex-[1_1_0px] gap-6">
        <TrainingCard />
        <RankedCard />
        <FriendsDuelCard />
      </div>
    </>
  );
};
