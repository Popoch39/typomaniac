import {
  computeScore,
  type Keystroke,
  keystrokesUpTo,
  replayRun,
  type RunConfig,
} from "typing-engine";

import type { DuelHudModel, DuelHudPlayer } from "@/components/duel-hud/duel-hud-model";

// The scripted Duel of the board B2 · Affiche (canvas « HUD du Duel Ranked »), @popoch against
// @kzr_, as real logs of Keystrokes the engine replays: the board's own engine applies the same
// rules of Score, so the Scores, Combos and carets match it at every moment.

// The board's Text, in its order.
const WORDS = (
  "river light chair after music bright story forest garden every simple window " +
  "morning quick travel before friend water paper strange summer happy island neighbor shadow " +
  "market kitchen gentle picture always world bridge heavy climb coffee number young evening " +
  "winter narrow listen stranger dream carry sweet color minute animal teacher again quiet brave " +
  "letter build ocean father ready never sister valley under catch money swim sharp"
).split(" ");

const SCRIPTED_SECONDS = 30;

const DUEL_MS = SCRIPTED_SECONDS * 1000;

// The time is up `t` ms after GO.
export const isOver = (t: number) => t >= DUEL_MS;

// The board's Text written out; the Seed only draws the words past it, which no one reaches.
const CONFIG: RunConfig = {
  mode: "time",
  seconds: SCRIPTED_SECONDS,
  language: "en",
  wordListVersion: 1,
  seed: 1,
  text: WORDS,
};

// A wrong letter corrected is erased this long after it was typed, and typed right this long
// after it: the rest of the word comes that much later.
const ERASE_MS = 250;

const FIX_MS = 420;

// A wrong letter typed at `letter` of the word at `word`, corrected or left as it is.
type ScriptedMistake = { word: number; letter: number; corrected: boolean };

// How one player types the Text: their Pace, when their first letter comes after GO, each word's
// cadence in wpm, space included, and their mistakes.
type TypingPlan = {
  handle: string;
  pace: number;
  reaction: number;
  wpm: readonly number[];
  mistakes: readonly ScriptedMistake[];
};

const SELF_PLAN: TypingPlan = {
  handle: "popoch",
  pace: 68,
  reaction: 340,
  wpm: [
    70, 76, 78, 75, 77, 79, 94, 76, 78, 77, 76, 93, 78, 72, 74, 76, 77, 78, 76, 79, 77, 78, 77, 78,
    76, 96, 78, 77, 78, 76, 77, 78, 76, 77,
  ],
  mistakes: [{ word: 13, letter: 2, corrected: true }],
};

const OPPONENT_PLAN: TypingPlan = {
  handle: "kzr_",
  pace: 74,
  reaction: 300,
  wpm: [
    80, 82, 99, 81, 83, 82, 81, 80, 82, 83, 81, 82, 84, 82, 81, 83, 82, 84, 101, 83, 82, 84, 100,
    83, 82, 81, 82, 83, 82, 84, 83, 82, 81, 83, 82, 84, 83,
  ],
  mistakes: [
    { word: 7, letter: 2, corrected: false },
    { word: 25, letter: 4, corrected: true },
  ],
};

// Any letter but the right one.
const wrongLetter = (letter: string) => (letter === "x" ? "z" : "x");

// The Keystrokes of the whole plan, timed as the board times them, up to the end of the time: the
// server accepts none past it. The times are computed as the board computes them, float for
// float, so that each Burst is judged the same.
const keystrokesOf = (plan: TypingPlan) => {
  const keystrokes: Keystroke[] = [];
  const mistakes = new Map(plan.mistakes.map((mistake) => [mistake.word, mistake]));
  let start = plan.reaction;

  for (const [index, wpm] of plan.wpm.entries()) {
    // SAFETY: the plans never type more words than the board's Text has.
    const word = WORDS[index] as string;
    const msPerChar = 12_000 / wpm;
    const mistake = mistakes.get(index);
    const delay = mistake?.corrected === true ? FIX_MS : 0;

    for (const [position, letter] of [...word].entries()) {
      if (mistake?.letter === position) {
        const at = start + (position + 1) * msPerChar;

        keystrokes.push({ kind: "char", char: wrongLetter(letter), at });

        if (mistake.corrected) {
          keystrokes.push({ kind: "backspace", at: at + ERASE_MS });
          keystrokes.push({ kind: "char", char: letter, at: at + FIX_MS });
        }
      } else {
        const late = typeof mistake !== "undefined" && position > mistake.letter ? delay : 0;

        keystrokes.push({
          kind: "char",
          char: letter,
          at: start + (position + 1) * msPerChar + late,
        });
      }
    }

    start = start + (word.length + 1) * msPerChar + delay;
    keystrokes.push({ kind: "char", char: " ", at: start });
  }

  return keystrokes.filter((keystroke) => keystroke.at < DUEL_MS);
};

// One side of the scripted Duel: its player's Handle, Pace and whole log.
type ScriptedSide = { handle: string; pace: number; keystrokes: readonly Keystroke[] };

const sideOf = (plan: TypingPlan): ScriptedSide => ({
  handle: plan.handle,
  pace: plan.pace,
  keystrokes: keystrokesOf(plan),
});

export const SCRIPTED_SELF = sideOf(SELF_PLAN);

export const SCRIPTED_OPPONENT = sideOf(OPPONENT_PLAN);

// How many of the side's Keystrokes are typed `t` ms into the Duel: their Run and Score only
// change with it.
export const typedBy = (side: ScriptedSide, t: number) => keystrokesUpTo(side.keystrokes, t).length;

// The side's player once `typed` of their Keystrokes are in. Once the time is up, the right
// letters of the word in progress count, as the server counts them. Split from the time so that
// a caller replays the Run only when a Keystroke comes in, not at every frame.
export const scriptedPlayer = (
  side: ScriptedSide,
  typed: number,
  ended: boolean,
): ScriptedPlayer => {
  const keystrokes = side.keystrokes.slice(0, typed);
  const now = ended ? DUEL_MS : (keystrokes.at(-1)?.at ?? 0);

  return {
    handle: side.handle,
    run: replayRun(CONFIG, keystrokes),
    score: computeScore(CONFIG, keystrokes, side.pace, now),
    keystrokes,
    connected: true,
  };
};

// Both players of the scripted Duel have their Handle.
type ScriptedPlayer = DuelHudPlayer & { handle: string };

// The outcome the server would give once the time is up, simulated on the Scores alone.
const simulatedOutcome = (self: ScriptedPlayer, opponent: ScriptedPlayer) => {
  const lead = self.score.score - opponent.score.score;

  if (lead === 0) {
    return "draw";
  }

  return lead > 0 ? "win" : "loss";
};

// The scripted Duel `t` ms after GO, a Ranked Duel.
export const scriptedDuel = (
  self: ScriptedPlayer,
  opponent: ScriptedPlayer,
  t: number,
): DuelHudModel => ({
  self,
  opponent,
  challenge: false,
  seconds: SCRIPTED_SECONDS,
  elapsed: t,
  outcome: isOver(t) ? simulatedOutcome(self, opponent) : null,
});
