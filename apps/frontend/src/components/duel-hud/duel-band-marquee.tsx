import { cn } from "cn";

// About this many characters to a row: enough to run past the widest half of the band.
const ROW_CHARS = 32;

// The Handle repeated along a row, as the board repeats it: at least 4 times.
const rowOf = (handle: string) => {
  const count = Math.max(4, Math.ceil(ROW_CHARS / (handle.length + 3)));

  return Array.from({ length: count }, () => handle).join(" · ");
};

type DuelBandMarqueeProps = { handle: string; mirrored: boolean };

// A player's Handle repeated big and faint behind their half of the band, on two rows set off
// from each other, in the ink the Theme lays on their colour; the opponent's runs from the right
// edge.
export const DuelBandMarquee = ({ handle, mirrored }: DuelBandMarqueeProps) => {
  const row = rowOf(handle);

  return (
    <div
      className={cn(
        "absolute -top-4 flex flex-col font-display text-[69px] leading-[0.9] font-extrabold whitespace-nowrap",
        mirrored ? "-right-[30px] items-end text-on-opponent/10" : "-left-[30px] text-on-brand/10",
      )}
    >
      <span>{row}</span>
      <span className={mirrored ? "mr-[150px]" : "ml-[130px]"}>{row}</span>
    </div>
  );
};
