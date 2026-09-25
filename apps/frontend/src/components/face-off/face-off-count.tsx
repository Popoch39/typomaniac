import { DIGITS, digitName } from "@/components/face-off/face-off-timeline";

const MARKS = [
  { part: "vs", label: "VS" },
  ...DIGITS.map(({ mark }) => ({ part: digitName(mark), label: mark })),
];

// The VS of the impact and the giant 3-2-1 then GO, stacked on the diagonal's middle, each shown
// in turn by the timeline. Seen only: the announcer says them.
export const FaceOffCount = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0">
    {MARKS.map(({ part, label }) => (
      <span
        key={part}
        data-face-off={part}
        className="invisible absolute inset-0 flex items-center justify-center font-mono text-[14rem] leading-none font-extrabold text-foreground italic tabular-nums opacity-0 [text-shadow:0_0.06em_0_var(--brand)]"
      >
        {label}
      </span>
    ))}
  </div>
);
