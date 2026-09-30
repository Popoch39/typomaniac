import { useRunStore } from "@/stores/run-store";

// How many words of the Text the glimpse shows, and how many of them are shown typed.
const SHOWN_WORDS = 5;

const TYPED_WORDS = 2;

// A glimpse of the Run's Text, as it would be typed: its first words, a caret after two of them.
// A drawing: hidden from screen readers. As many whole lines as the live zone holds (`cqh`), never
// one cut.
export const TrainingSample = () => {
  const words = useRunStore((state) =>
    state.run.words
      .slice(0, SHOWN_WORDS)
      .map((word) => word.target)
      .join(" "),
  ).split(" ");

  return (
    <p
      aria-hidden="true"
      className="max-h-[round(down,100cqh,1lh)] w-full overflow-hidden font-mono text-[26px] leading-[1.6] font-bold text-pending"
    >
      <span className="text-foreground">{words.slice(0, TYPED_WORDS).join(" ")}</span>
      <span className="mx-[-1.5px] inline-block h-[1.1em] w-0.75 rounded-xs bg-caret align-text-bottom" />{" "}
      {words.slice(TYPED_WORDS).join(" ")}
    </p>
  );
};
