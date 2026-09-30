import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRun, type Keystroke, replayRun, type RunConfig } from "typing-engine";

import { EXCERPT_WORDS, excerptLength } from "@/components/play/ghost-typing";
import { useGhostTyping } from "@/components/play/use-ghost-typing";
import { RunCaret } from "@/components/run/run-caret";
import { RunWord } from "@/components/run/run-word";
import { readTextLayout } from "@/components/run/text-layout";
import { useWrongWordWave } from "@/components/run/use-wrong-word-wave";

type GhostExcerptProps = {
  config: RunConfig;
  // What moves its caret, `at` in ms since the first one.
  keystrokes: readonly Keystroke[];
  // The Ghost of a Best Run: its letters lit as it types them, its caret apart from the User's,
  // typed to its end when nothing moves. Otherwise the glimpse of a Text: only its caret goes on,
  // resting at the start.
  ghost: boolean;
};

// How many of the words start the excerpt and fit whole in its box: the lines it shows.
const wordsShown = (box: HTMLElement, words: HTMLElement) => {
  let count = 0;

  for (const word of words.children) {
    if (!(word instanceof HTMLElement) || word.offsetTop + word.offsetHeight > box.clientHeight) {
      break;
    }

    count += 1;
  }

  return count;
};

// The start of a Text and one caret typing it, as in a Run: the Ghost lights its letters and waves
// its Wrong words. As many whole lines as its zone holds (`cqh`), never one cut; the typing covers
// these lines only, then starts again. A drawing: hidden from screen readers. Where its caret
// stands is on the excerpt (`data-caret`), for the tests: happy-dom lays nothing out.
export const GhostExcerpt = ({ config, keystrokes, ghost }: GhostExcerptProps) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const [shownWords, setShownWords] = useState(EXCERPT_WORDS);

  useEffect(() => {
    const box = boxRef.current;
    const words = wordsRef.current;

    if (box === null || words === null) {
      return;
    }

    const observer = new ResizeObserver(() => setShownWords(wordsShown(box, words)));

    observer.observe(box);

    return () => observer.disconnect();
  }, []);

  const length = excerptLength(config, keystrokes, shownWords);
  const typed = useGhostTyping(boxRef, keystrokes, length, ghost ? "end" : "start");
  const typedRun = replayRun(config, keystrokes.slice(0, typed));
  const { wordIndex, letterIndex } = typedRun;
  const shown = ghost ? typedRun : createRun(config);

  useWrongWordWave(wordsRef, shown);

  useLayoutEffect(() => {
    const words = wordsRef.current;
    const caret = caretRef.current;
    const layout = words === null ? null : readTextLayout(words, wordIndex, letterIndex);

    if (caret !== null && layout !== null) {
      caret.style.transform = `translate(${layout.caretX}px, ${layout.caretY}px)`;
    }
  }, [wordIndex, letterIndex]);

  return (
    // The height left in the live zone, whose lines `cqh` counts.
    <div className="flex min-h-0 w-full flex-1 flex-col justify-center [container-type:size]">
      <div
        ref={boxRef}
        data-excerpt
        data-caret={`${wordIndex}:${letterIndex}`}
        aria-hidden="true"
        className="relative max-h-[round(down,100cqh,1lh)] w-full overflow-hidden font-mono text-[26px] leading-relaxed font-bold"
      >
        <RunCaret ref={caretRef} tone={ghost ? "opponent" : "own"} />
        <div ref={wordsRef} className="flex flex-wrap gap-x-[1ch]">
          {shown.words.slice(0, EXCERPT_WORDS).map((word) => (
            <RunWord
              key={word.index}
              word={word}
              validated={word.index < shown.validatedWords}
              burst={null}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
