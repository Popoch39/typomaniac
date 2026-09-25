import { cn } from "cn";

// Enough rows to cover the height of the screen, at the rows' size, each running the other way
// from the one above.
const ROWS = [
  { id: 1, backward: false },
  { id: 2, backward: true },
  { id: 3, backward: false },
  { id: 4, backward: true },
  { id: 5, backward: false },
  { id: 6, backward: true },
];

type FaceOffMarqueeProps = {
  // Null while this User's is being read: the panel stays plain.
  handle: string | null;
  // The opponent's rows run the other way from this User's.
  reversed: boolean;
};

// A player's Handle, giant and faint, repeated on rows that slide one way then the other behind
// their panel. Each row is two identical halves: sliding by half of it loops without a seam.
export const FaceOffMarquee = ({ handle, reversed }: FaceOffMarqueeProps) => (
  <div
    aria-hidden
    className="absolute -top-[2.5vh] left-0 flex flex-col text-[18.5vh] leading-[0.92] font-extrabold tracking-[-0.03em] whitespace-nowrap text-background/12"
  >
    {handle === null
      ? null
      : ROWS.map(({ id, backward }) => (
          <div
            key={id}
            className={cn(
              "motion-safe:animate-face-off-marquee",
              backward !== reversed && "[animation-direction:reverse]",
            )}
          >
            {`${handle} · `.repeat(8)}
          </div>
        ))}
  </div>
);
