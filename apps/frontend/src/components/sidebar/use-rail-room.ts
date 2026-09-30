import { type RefObject, useEffect, useState } from "react";

// A Friend's row in the Rail (h-12), and « +N » under them (h-8).
const ROW_HEIGHT = 48;

const MORE_HEIGHT = 32;

// How many of the `rows` Friend rows the Rail draws in a zone `height` px tall, `count` Friends
// there: all of them when they fit with « +N » (if some are left out); otherwise only those that
// fit above « +N ». Never a row cut, never a scroll.
export const railRowsShown = (height: number, rows: number, count: number) => {
  const more = count > rows ? MORE_HEIGHT : 0;

  if (rows * ROW_HEIGHT + more <= height) {
    return rows;
  }

  return Math.max(0, Math.floor((height - MORE_HEIGHT) / ROW_HEIGHT));
};

// The height of the Rail's zone for its Friends, the room the nav leaves them above the foot; null
// until measured, and out of the Rail. Its size never follows what it holds (flex-1, min-h-0):
// measured again when it changes, never looping on its own measure. The observer's first call
// comes before the first paint: no row is drawn cut.
export const useRailRoom = (zoneRef: RefObject<HTMLElement | null>, rail: boolean) => {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const zone = zoneRef.current;

    if (!rail || zone === null) {
      return;
    }

    const observer = new ResizeObserver(() => setHeight(zone.clientHeight));

    observer.observe(zone);

    return () => observer.disconnect();
  }, [zoneRef, rail]);

  return rail ? height : null;
};
