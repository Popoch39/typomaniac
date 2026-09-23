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

const resumePrompt = () => screen.queryByRole("button", { name: "clique ou tape pour reprendre" });

const typingInput = () => screen.getByLabelText("Zone de frappe");

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

  test("shows every letter state apart: right, wrong, extra, missed and not typed yet", async () => {
    const { user } = renderRun();

    await user.keyboard("sma helpx whxle");

    expect(letterStatuses("small")).toEqual(["correct", "correct", "correct", "missed", "missed"]);
    expect(letterStatuses("helpx")).toEqual(["correct", "correct", "correct", "correct", "extra"]);
    expect(letterStatuses("while")).toEqual([
      "correct",
      "correct",
      "incorrect",
      "correct",
      "correct",
    ]);
    expect(letterStatuses("late")).toEqual(["pending", "pending", "pending", "pending"]);
  });

  test("backspace corrects the current word, then goes back to a wrong previous word", async () => {
    const { user } = renderRun();

    await user.keyboard("smallx {Backspace}");

    expect(screen.getByText("0/10")).toBeInTheDocument();

    await user.keyboard("{Backspace} help");

    expect(letterStatuses("small").every((status) => status === "correct")).toBe(true);
    expect(screen.getByText("1/10")).toBeInTheDocument();

    // "small" is right now: backspace stops at the start of "help".
    await user.keyboard("{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}");

    expect(screen.getByText("1/10")).toBeInTheDocument();
  });

  test("Ctrl+Backspace erases the current word", async () => {
    const { user } = renderRun();

    await user.keyboard("smoll{Control>}{Backspace}{/Control}");

    expect(letterStatuses("small")).toEqual([
      "pending",
      "pending",
      "pending",
      "pending",
      "pending",
    ]);
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

describe("HomePage focus", () => {
  test("losing the focus hides the Text behind a prompt to resume", async () => {
    const { user } = renderRun();

    expect(typingInput()).toHaveFocus();
    expect(resumePrompt()).not.toBeInTheDocument();

    await user.click(document.body);

    expect(resumePrompt()).toBeInTheDocument();
  });

  test("a click on the Text gives the focus back", async () => {
    const { user } = renderRun();

    await user.click(document.body);
    await user.click(screen.getByRole("button", { name: "clique ou tape pour reprendre" }));

    expect(typingInput()).toHaveFocus();
    expect(resumePrompt()).not.toBeInTheDocument();

    await user.keyboard("s");

    expect(letterStatuses("small")[0]).toBe("correct");
  });

  test("a key gives the focus back without being typed", async () => {
    const { user } = renderRun();

    await user.click(document.body);
    await user.keyboard("x");

    expect(typingInput()).toHaveFocus();
    expect(resumePrompt()).not.toBeInTheDocument();
    expect(letterStatuses("small")[0]).toBe("pending");
  });

  test("a key typed on a focused button gives the focus back too", async () => {
    const { user } = renderRun();

    await user.click(document.body);
    // Backwards from the page, the overlay is the first stop (the hidden input comes before it).
    await user.tab({ shift: true });

    expect(resumePrompt()).toHaveFocus();

    await user.keyboard("x");

    expect(typingInput()).toHaveFocus();
  });

  test("the clock keeps running while the focus is lost", async () => {
    const { user, advance } = renderRun();

    await user.keyboard("small help while late letter");
    await user.click(document.body);
    advance(60_000);
    await user.click(screen.getByRole("button", { name: "clique ou tape pour reprendre" }));
    await user.keyboard(" sell driver quiet never learn");

    // Same Run as above, typed in one minute because the minute out of focus counts.
    expect(stat("wpm")).toBe("12");
  });
});
