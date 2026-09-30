import type { CharCounts } from "typing-engine";

import { DuelEndTapeName } from "@/components/duel-end/duel-end-tape-name";
import { tapeChars } from "@/components/duel-end/tape-lines";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type DuelEndTapeCharsProps = { mine: CharCounts; theirs: CharCounts };

// Under the figures, both players' characters: correct, incorrect, extra, missed.
export const DuelEndTapeChars = ({ mine, theirs }: DuelEndTapeCharsProps) => {
  const locale = useLocale();

  return (
    <tr className="h-[58px] font-mono text-lg text-muted-foreground tabular-nums">
      <td className="text-right">{tapeChars(mine, locale)}</td>
      <DuelEndTapeName title={m.run_stat_chars_detail({}, { locale })}>
        {m.run_stat_chars({}, { locale })}
      </DuelEndTapeName>
      <td>{tapeChars(theirs, locale)}</td>
    </tr>
  );
};
