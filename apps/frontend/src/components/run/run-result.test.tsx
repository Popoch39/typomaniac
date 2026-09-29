import { render, screen } from "@testing-library/react";
import type { Result } from "typing-engine";
import { describe, expect, test } from "vitest";

import { RunResult } from "@/components/run/run-result";
import { ScoreResult } from "@/components/run/score-result";
import { useLocaleStore } from "@/stores/locale-store";

// The narrow no-break space French puts between thousands.
const NNBSP = " ";

const result: Result = {
  wpm: 1283.6,
  raw: 1290.2,
  accuracy: 96.6,
  consistency: 80.4,
  chars: { correct: 1049, incorrect: 2, extra: 1, missed: 0 },
};

const score = { score: 12_840, bestCombo: 1234, bursts: 3 };

const stat = (term: string) => screen.getByText(term).nextElementSibling?.textContent;

describe("the Result of a Run", () => {
  test("writes its figures the French way", () => {
    render(
      <>
        <ScoreResult score={score} />
        <RunResult result={result} />
      </>,
    );

    expect(stat("score")).toBe(`12${NNBSP}840`);
    expect(stat("meilleur combo")).toBe(`1${NNBSP}234`);
    expect(stat("wpm")).toBe(`1${NNBSP}284`);
    expect(stat("précision")).toBe("97 %");
    expect(stat("régularité")).toBe("80 %");
    expect(stat("caractères")).toBe(`1${NNBSP}049/2/1/0`);
  });

  test("writes its figures the English way", () => {
    useLocaleStore.setState({ locale: "en" });
    render(
      <>
        <ScoreResult score={score} />
        <RunResult result={result} />
      </>,
    );

    expect(stat("score")).toBe("12,840");
    expect(stat("best combo")).toBe("1,234");
    expect(stat("bursts")).toBe("3");
    expect(stat("wpm")).toBe("1,284");
    expect(stat("raw")).toBe("1,290");
    expect(stat("accuracy")).toBe("97%");
    expect(stat("consistency")).toBe("80%");
    expect(stat("characters")).toBe("1,049/2/1/0");
  });

  test("shows « — » for a Score played before there was one", () => {
    useLocaleStore.setState({ locale: "en" });
    render(<ScoreResult score={null} />);

    expect(stat("score")).toBe("—");
    expect(stat("best combo")).toBe("—");
  });
});
