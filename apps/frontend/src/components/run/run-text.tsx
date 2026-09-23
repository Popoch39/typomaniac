import { RunWord } from "@/components/run/run-word";
import { useRunStore } from "@/stores/run-store";

// The Text of the Run. A keystroke only replaces the current word, so the others keep their
// identity and the React Compiler skips them.
export const RunText = () => {
  const words = useRunStore((state) => state.run.words);

  return (
    <div className="flex flex-wrap gap-x-[1ch] gap-y-2 text-2xl leading-relaxed">
      {words.map((word) => (
        <RunWord key={word.index} word={word} />
      ))}
    </div>
  );
};
