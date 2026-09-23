import { KeystrokeInput } from "@/components/run/keystroke-input";
import { RunText } from "@/components/run/run-text";
import { WordCounter } from "@/components/run/word-counter";

export const TypingArea = () => (
  <div className="flex flex-col gap-4">
    <KeystrokeInput />
    <WordCounter />
    <RunText />
  </div>
);
