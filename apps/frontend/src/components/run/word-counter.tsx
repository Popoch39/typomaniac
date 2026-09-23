import { useRunStore } from "@/stores/run-store";

// Validated words out of the Run's words, e.g. `3/10`.
export const WordCounter = () => {
  const validated = useRunStore((state) => state.run.validatedWords);
  const total = useRunStore((state) => state.run.words.length);

  return (
    <p className="text-xl text-caret tabular-nums">
      {validated}/{total}
    </p>
  );
};
