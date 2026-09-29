import { NextRunKeys } from "@/components/run/next-run-keys";
import { ResultScreen } from "@/components/run/result-screen";
import { TypingArea } from "@/components/run/typing-area";
import { useRunStore } from "@/stores/run-store";

// The Solo Run in the middle of the page: the typing area while it lasts, then its Result, and the
// keys to the next Run at the foot. Each Run gets a fresh typing area, so a Run started from within
// another one starts from scratch, focus included.
export const SoloArea = () => {
  const result = useRunStore((state) => state.result);
  const runNumber = useRunStore((state) => state.runNumber);

  return (
    <>
      <div className="flex flex-1 flex-col justify-center">
        {result === null ? <TypingArea key={runNumber} /> : <ResultScreen result={result} />}
      </div>
      <NextRunKeys />
    </>
  );
};
