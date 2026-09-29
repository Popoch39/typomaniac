import { RunCounter } from "@/components/run/run-counter";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { useRunStore } from "@/stores/run-store";

// Validated words out of the Run's words, e.g. `3/10`.
export const WordCounter = () => {
  const locale = useLocale();
  const validated = useRunStore((state) => state.run.validatedWords);
  const total = useRunStore((state) => state.run.words.length);
  const numbers = numberFormat(locale);

  return (
    <RunCounter>
      {numbers.format(validated)}/{numbers.format(total)}
    </RunCounter>
  );
};
