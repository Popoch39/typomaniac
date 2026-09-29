type LogoStroke = {
  d: string;
  width: number;
};

// A drawing of the Logo's symbol: the t's stem, its bar, then the wave underneath, like a typo.
type LogoDrawing = {
  stem: LogoStroke;
  bar: LogoStroke;
  wave: LogoStroke;
};

export type LogoDrawingName = "full" | "simplified";

// The symbol's two drawings (boards 01 and 04 of the "Intégration du logo" canvas), on a 100 × 100
// viewBox, round strokes and no fill: the full one from 24 px, the simplified one below, whose two
// humps and thicker strokes stay sharp where the four humps blur into one line. The one source of
// every place that draws the Logo.
export const LOGO_DRAWINGS: Record<LogoDrawingName, LogoDrawing> = {
  full: {
    stem: { d: "M46 12 V50 Q46 60 56 60 H66", width: 12 },
    bar: { d: "M30 30 H64", width: 12 },
    wave: { d: "M16 82 Q24 72 32 82 T48 82 T64 82 T80 82", width: 7 },
  },
  simplified: {
    stem: { d: "M46 8 V46 Q46 56 56 56 H68", width: 16 },
    bar: { d: "M28 28 H66", width: 16 },
    wave: { d: "M14 84 Q30 70 46 84 T78 84", width: 13 },
  },
};
