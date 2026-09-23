import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { ClockContext } from "@/components/run/clock-context";
import { HomePage } from "@/pages/home-page";
import { useRunStore } from "@/stores/run-store";

// Seed 42 in English gives this Text (pinned in the typing-engine tests).
const text = "small help while late letter sell driver quiet never learn";

// Starts a fresh Run on Seed 42, with a clock the test moves by hand.
const renderRun = () => {
  let now = 1_000;

  useRunStore.getState().start(42);
  render(
    <ClockContext value={() => now}>
      <HomePage />
    </ClockContext>,
  );

  return {
    user: userEvent.setup(),
    advance: (ms: number) => {
      now += ms;
    },
  };
};

// A word is split into one element per letter: match the element that holds them all.
const isWord = (word: string) => (_: string, element: Element | null) =>
  element !== null && element.children.length > 0 && element.textContent === word;

const letterStatuses = (word: string) =>
  Array.from(screen.getByText(isWord(word)).children, (letter) =>
    letter.getAttribute("data-status"),
  );

const stat = (term: string) => screen.getByText(term).nextElementSibling?.textContent;

describe("HomePage", () => {
  test("shows the Text to type and the word counter", () => {
    renderRun();

    for (const word of text.split(" ")) {
      expect(screen.getByText(isWord(word))).toBeInTheDocument();
    }

    expect(screen.getByText("0/10")).toBeInTheDocument();
  });

  test("colors each typed letter right or wrong, and counts validated words", async () => {
    const { user } = renderRun();

    await user.keyboard("sn");

    expect(letterStatuses("small")).toEqual([
      "correct",
      "incorrect",
      "pending",
      "pending",
      "pending",
    ]);

    await user.keyboard("all ");

    expect(screen.getByText("1/10")).toBeInTheDocument();
  });

  test("a full Run ends on its Result", async () => {
    const { user, advance } = renderRun();

    await user.keyboard(text.slice(0, -1));
    advance(60_000);
    await user.keyboard(text.slice(-1));

    // 49 letters and 9 spaces, all right, in one minute: 58 / 5 = 11.6 wpm.
    expect(stat("wpm")).toBe("12");
    expect(stat("précision")).toBe("100 %");
    expect(screen.queryByText(isWord("small"))).not.toBeInTheDocument();
  });
});
