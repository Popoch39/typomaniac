import { useFramesPerSecond } from "@/components/aura-gallery/use-frames-per-second";

// The page's frame rate, always in sight above everything, to read the cost of the Ornaments
// while scrolling.
export const FpsCounter = () => {
  const fps = useFramesPerSecond();

  return (
    <output
      aria-label="Images par seconde"
      className="fixed top-4 right-4 z-50 rounded-full bg-ink/90 px-4 py-2 font-mono text-sm font-bold tabular-nums ring-1 ring-border"
    >
      {fps ?? "–"} fps
    </output>
  );
};
