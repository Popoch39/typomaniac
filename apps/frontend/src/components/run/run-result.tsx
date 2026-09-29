import type { CharCounts, Result } from "typing-engine";

import { ResultStat } from "@/components/run/result-stat";
import type { RunTone } from "@/components/run/run-tone";

// e.g. `49/2/1/0`, in the order of the description below.
const formatChars = (chars: CharCounts) =>
  `${chars.correct}/${chars.incorrect}/${chars.extra}/${chars.missed}`;

// Whose Result it is, for its colour.
type RunResultProps = { result: Result; tone?: RunTone };

// The Result of a finished Run, rounded for display: wpm and accuracy first, then the details.
export const RunResult = ({ result, tone }: RunResultProps) => (
  <div className="flex flex-col gap-6">
    <dl className="flex gap-12">
      <ResultStat term="wpm" size="main" tone={tone}>
        {Math.round(result.wpm)}
      </ResultStat>
      <ResultStat term="précision" size="main" tone={tone}>
        {Math.round(result.accuracy)} %
      </ResultStat>
    </dl>
    <dl className="flex flex-wrap gap-x-12 gap-y-4">
      <ResultStat term="raw" size="secondary" tone={tone}>
        {Math.round(result.raw)}
      </ResultStat>
      <ResultStat term="régularité" size="secondary" tone={tone}>
        {Math.round(result.consistency)} %
      </ResultStat>
      <ResultStat
        term="caractères"
        size="secondary"
        tone={tone}
        description="justes / fausses / en trop / oubliées"
      >
        {formatChars(result.chars)}
      </ResultStat>
    </dl>
  </div>
);
