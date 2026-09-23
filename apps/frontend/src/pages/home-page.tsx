import { RunResult } from "@/components/run/run-result";
import { TypingArea } from "@/components/run/typing-area";
import { useRunStore } from "@/stores/run-store";

// The Run page: the typing area while the Run lasts, then its Result.
export const HomePage = () => {
  const result = useRunStore((state) => state.result);

  return (
    <section className="flex flex-col gap-4 py-12">
      <h1 className="sr-only">typomaniac</h1>
      {result === null ? <TypingArea /> : <RunResult result={result} />}
    </section>
  );
};
