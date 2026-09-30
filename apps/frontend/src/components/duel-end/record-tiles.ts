import type { DuelEnding } from "@/stores/duel-store";

// The User's three Records, as the server tells them and the Profile shows them.
export type RecordId = keyof NonNullable<DuelEnding["records"]>;

// A Record against this Duel's figure, both rounded as the Profile shows them. Beaten, the Record
// from before it (null for a first one); otherwise the Record that still holds.
export type RecordTile =
  | { id: RecordId; beaten: true; figure: number; before: number | null }
  | { id: RecordId; beaten: false; figure: number; record: number };

type EndingFigures = Pick<DuelEnding, "result" | "score" | "records">;

const FIGURES: { id: RecordId; of: (ending: EndingFigures) => number }[] = [
  { id: "wpm", of: (ending) => ending.result.wpm },
  { id: "score", of: (ending) => ending.score.score },
  { id: "combo", of: (ending) => ending.score.bestCombo },
];

// Each Record against this Duel, the Forfeits and the Challenges alike, as the Profile counts
// them: compared rounded (68.2 then 68.4 beats nothing, the Profile shows 68 both times), beaten
// only when passed, and by any figure when never set. Null when the Records could not be read:
// none is shown rather than a false one.
export const recordTiles = (ending: EndingFigures): RecordTile[] | null => {
  const { records } = ending;

  if (records === null) {
    return null;
  }

  return FIGURES.map(({ id, of }) => {
    const figure = Math.round(of(ending));
    const held = records[id];
    const record = held === null ? null : Math.round(held);

    return record === null || figure > record
      ? { id, beaten: true, figure, before: record }
      : { id, beaten: false, figure, record };
  });
};

// The Records this Duel beats: the band stamps the Score's, the tale of the tape the wpm's and the
// Combo's.
export const beatenRecords = (tiles: RecordTile[] | null): ReadonlySet<RecordId> =>
  new Set((tiles ?? []).flatMap((tile) => (tile.beaten ? [tile.id] : [])));
