import { ResultScreen } from "@/components/run/result-screen";
import { TypingArea } from "@/components/run/typing-area";
import { useRunStore } from "@/stores/run-store";

// The Run page: the typing area while the Run lasts, then its Result. Each Run gets a fresh typing
// area, so a Run started from within another one starts from scratch, focus included.
export const HomePage = () => {
  const result = useRunStore((state) => state.result);
  const runNumber = useRunStore((state) => state.runNumber);

  return (
    <section className="flex flex-col gap-4 py-12">
      <h1 className="sr-only">typomaniac</h1>
      {result === null ? <TypingArea key={runNumber} /> : <ResultScreen result={result} />}
    </section>
  );
};
