import { FocusOverlay } from "@/components/run/focus-overlay";
import { KeystrokeInput } from "@/components/run/keystroke-input";
import { LiveScore } from "@/components/run/live-score";
import { NextRunButton } from "@/components/run/next-run-button";
import { RunProgress } from "@/components/run/run-progress";
import { SoloText } from "@/components/run/solo-text";
import { usePace } from "@/components/run/use-pace";
import { useTypingFocus } from "@/components/run/use-typing-focus";
import { useRunStore } from "@/stores/run-store";

export const TypingArea = () => {
  const { inputRef, veiled, setFocused, focus } = useTypingFocus();
  const press = useRunStore((state) => state.press);
  const pace = usePace();

  return (
    <div className="flex flex-col gap-4">
      <KeystrokeInput
        ref={inputRef}
        onFocusChange={setFocused}
        onPress={(key, now) => press(key, now, pace)}
      />
      <div className="flex items-end justify-between gap-4 px-2">
        <RunProgress />
        <LiveScore />
      </div>
      <div className="relative rounded-card bg-card px-10 py-7.5">
        <SoloText />
        {veiled ? <FocusOverlay onResume={focus} /> : null}
      </div>
      {/* Right after the input in the tab order: Tab then Enter starts the next Run. */}
      <div className="self-center">
        <NextRunButton />
      </div>
    </div>
  );
};
