import { useId } from "react";

import { replaySeconds } from "@/components/replay/replay-seconds";
import { Slider } from "@/components/ui/slider";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type ReplayTimelineProps = { t: number; duration: number; onSeek: (target: number) => void };

// The time bar of the Replay, between its time and its length: it follows `t`, and moving it, by
// mouse or arrow keys (a tenth of a second, 5 s with Page up / down), goes straight to that
// instant. Its seconds in the Locale.
export const ReplayTimeline = ({ t, duration, onSeek }: ReplayTimelineProps) => {
  const labelId = useId();
  const locale = useLocale();
  const length = replaySeconds(duration, locale);

  return (
    <div className="flex items-center gap-4">
      <span id={labelId} className="sr-only">
        {m.replay_timeline({}, { locale })}
      </span>
      <span
        role="timer"
        aria-label={m.replay_timer({}, { locale })}
        className="min-w-15 font-mono text-sm font-semibold tabular-nums"
      >
        {replaySeconds(t, locale)}
      </span>
      <Slider
        aria-labelledby={labelId}
        size="lg"
        className="flex-1"
        min={0}
        max={duration}
        step={100}
        largeStep={5_000}
        value={t}
        onValueChange={onSeek}
        getAriaValueText={(_, value) =>
          m.replay_timeline_value(
            { time: replaySeconds(value, locale), duration: length },
            { locale },
          )
        }
      />
      <span className="font-mono text-sm text-muted-foreground tabular-nums">{length}</span>
    </div>
  );
};
