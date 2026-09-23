import { TimeLeft } from "@/components/run/time-left";
import { WordCounter } from "@/components/run/word-counter";
import { useRunStore } from "@/stores/run-store";

// How far the Run is: the time left in `time` Mode, the words done in `words` Mode.
export const RunProgress = () => {
  const seconds = useRunStore((state) =>
    state.run.config.mode === "time" ? state.run.config.seconds : null,
  );

  return seconds === null ? <WordCounter /> : <TimeLeft seconds={seconds} />;
};
