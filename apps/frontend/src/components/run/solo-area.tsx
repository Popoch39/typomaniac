import { ResultScreen } from "@/components/run/result-screen";
import { TypingArea } from "@/components/run/typing-area";
import { useRunStore } from "@/stores/run-store";

// The Solo Run: the typing area while it lasts, then its Result. Each Run gets a fresh typing area,
// so a Run started from within another one starts from scratch, focus included.
export const SoloArea = () => {
  const result = useRunStore((state) => state.result);
  const runNumber = useRunStore((state) => state.runNumber);

  return result === null ? <TypingArea key={runNumber} /> : <ResultScreen result={result} />;
};
