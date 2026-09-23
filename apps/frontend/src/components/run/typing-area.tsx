import { FocusOverlay } from "@/components/run/focus-overlay";
import { KeystrokeInput } from "@/components/run/keystroke-input";
import { NextRunButton } from "@/components/run/next-run-button";
import { RunProgress } from "@/components/run/run-progress";
import { RunText } from "@/components/run/run-text";
import { useTypingFocus } from "@/components/run/use-typing-focus";

export const TypingArea = () => {
  const { inputRef, focused, setFocused, focus } = useTypingFocus();

  return (
    <div className="flex flex-col gap-4">
      <KeystrokeInput ref={inputRef} onFocusChange={setFocused} />
      <RunProgress />
      <div className="relative">
        <RunText />
        {focused ? null : <FocusOverlay onResume={focus} />}
      </div>
      {/* Right after the input in the tab order: Tab then Enter starts the next Run. */}
      <div className="self-center">
        <NextRunButton />
      </div>
    </div>
  );
};
