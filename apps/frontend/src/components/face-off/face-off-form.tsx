import type { Form } from "api";
import { cn } from "cn";

import { FaceOffFormMark } from "@/components/face-off/face-off-form-mark";

type FaceOffFormProps = { form: Form | null };

const CHIP = "rounded-xl bg-background px-4 py-2.5 text-lg font-semibold";

// Each outcome of the Form with a key of its own: the outcome and how many of it came before. The
// Form never changes during the Face-off.
const marksOf = (outcomes: Form["outcomes"]) => {
  const seen = { win: 0, loss: 0, draw: 0 };

  return outcomes.map((outcome) => {
    seen[outcome] += 1;

    return { key: `${outcome}-${seen[outcome]}`, outcome };
  });
};

// A player's Form in the Face-off: their last Ranked Duels, the most recent first, then their
// average wpm over those. Each comes in after the other (`form-item`, the timeline's cascade).
// Without a Ranked Duel, said absent rather than shown as zero.
export const FaceOffForm = ({ form }: FaceOffFormProps) => {
  if (form === null) {
    return (
      <p data-face-off="form-item" className={cn(CHIP, "text-muted-foreground")}>
        Aucun Duel classé
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <ol className="flex gap-2">
        {marksOf(form.outcomes).map(({ key, outcome }) => (
          <FaceOffFormMark key={key} outcome={outcome} />
        ))}
      </ol>
      <p data-face-off="form-item" className={cn(CHIP, "font-mono text-foreground tabular-nums")}>
        {Math.round(form.avgWpm)} wpm
      </p>
    </div>
  );
};
