import type { Result } from "typing-engine";

const statClassName = "flex flex-col gap-1";

const termClassName = "text-muted-foreground text-lg";

const valueClassName = "text-caret text-5xl tabular-nums";

// The Result of a finished Run, rounded for display.
export const RunResult = ({ result }: { result: Result }) => (
  <dl className="flex gap-12">
    <div className={statClassName}>
      <dt className={termClassName}>wpm</dt>
      <dd className={valueClassName}>{Math.round(result.wpm)}</dd>
    </div>
    <div className={statClassName}>
      <dt className={termClassName}>précision</dt>
      <dd className={valueClassName}>{Math.round(result.accuracy)} %</dd>
    </div>
  </dl>
);
