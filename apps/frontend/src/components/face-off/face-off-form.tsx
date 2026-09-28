import type { Form } from "api";

import { FaceOffFormMark } from "@/components/face-off/face-off-form-mark";

type FaceOffFormProps = { form: Form | null };

// Each outcome of the Form with a key of its own: the outcome and how many of it came before. The
// Form never changes during the Face-off.
const marksOf = (outcomes: Form["outcomes"]) => {
  const seen = { win: 0, loss: 0, draw: 0 };

  return outcomes.map((outcome) => {
    seen[outcome] += 1;

    return { key: `${outcome}-${seen[outcome]}`, outcome };
  });
};

// A player's Form in the Face-off, in ink on their colour: their last Ranked Duels, the most
// recent first, then their average wpm over those. Each comes in after the other (`form-item`,
// the timeline's cascade). Without a Ranked Duel, said absent rather than shown as zero.
export const FaceOffForm = ({ form }: FaceOffFormProps) => {
  if (form === null) {
    return (
      <p data-face-off="form-item" className="text-lg font-semibold opacity-70">
        Aucun Duel classé
      </p>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <ol className="flex gap-1.5">
        {marksOf(form.outcomes).map(({ key, outcome }) => (
          <FaceOffFormMark key={key} outcome={outcome} />
        ))}
      </ol>
      <p data-face-off="form-item" className="font-mono text-lg font-semibold tabular-nums">
        {Math.round(form.avgWpm)} wpm
      </p>
    </div>
  );
};
