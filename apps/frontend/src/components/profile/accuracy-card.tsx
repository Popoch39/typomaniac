import { useId } from "react";

import { AccuracyRing } from "@/components/profile/accuracy-ring";
import { PercentFigure } from "@/components/profile/percent-figure";
import { PROFILE_CARD_LABEL_PAINT } from "@/components/profile/profile-card-paint";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The User's average accuracy, on its card: the share, large, and a ring filled as much.
export const AccuracyCard = ({ accuracy }: { accuracy: number | null }) => {
  const locale = useLocale();
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-1 flex-col justify-between gap-6 rounded-card bg-card p-7"
    >
      <h2 id={titleId} className={PROFILE_CARD_LABEL_PAINT}>
        {m.profile_stat_average_accuracy({}, { locale })}
      </h2>
      <div className="flex items-end justify-between gap-4">
        <PercentFigure value={accuracy} />
        <AccuracyRing accuracy={accuracy ?? 0} />
      </div>
    </section>
  );
};
