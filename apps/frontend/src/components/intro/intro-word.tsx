type Letter = { key: string; letter: string; typo: boolean };

const lettersOf = (word: string, typo: boolean, from: number): Letter[] =>
  Array.from(word, (letter, index) => ({ key: String(from + index), letter, typo }));

// The word as the lockup types it: « typoman », the typo « ai », then « iac ». A proper name, the
// same in every Locale.
const LETTERS = [
  ...lettersOf("typoman", false, 0),
  ...lettersOf("ai", true, 7),
  ...lettersOf("iac", false, 9),
];

// The typo, in the Theme's colour of a loss, underlined with a wave.
const TYPO_PAINT =
  "text-destructive underline decoration-destructive decoration-wavy decoration-3 underline-offset-14";

// Where GSAP starts from, inline as it writes: every letter hidden, the caret there but unseen.
const UNTYPED = { display: "none" };

const CARET_OFF = { opacity: 0 };

// The name beside the Logo, each letter shown when GSAP types it, then the caret, in the accent.
export const IntroWord = () => (
  <span className="inline-flex items-center">
    {LETTERS.map(({ key, letter, typo }) => (
      <span
        key={key}
        data-intro={typo ? "typo" : "letter"}
        className={typo ? TYPO_PAINT : undefined}
        style={UNTYPED}
      >
        {letter}
      </span>
    ))}
    <span
      data-intro="caret"
      className="ml-1 inline-block h-15 w-[5px] rounded-[3px] bg-brand"
      style={CARET_OFF}
    />
  </span>
);
