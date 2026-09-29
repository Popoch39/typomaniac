// How far the wave stops short of each end of the word, in letters.
const WAVE_INSET = 0.12;

// The wave under a Wrong word of `letters` letters (the B · Logo setting of the "Vague des Wrong
// words" canvas), on a viewBox `letters` wide and 1 high: one crest and one trough per letter, never
// fewer than two halves in all, stretched to end right on the word's width.
export const wavePath = (letters: number) => {
  const halves = Math.max(2, 2 * letters);
  const half = (letters - 2 * WAVE_INSET) / halves;
  const at = (step: number) => (WAVE_INSET + step * half).toFixed(3);

  // The first half's control point, above the viewBox, bends it up to the top edge; each T mirrors
  // it for the next half, down to the bottom edge, then up again.
  const smooth = Array.from({ length: halves - 1 }, (_, step) => `T${at(step + 2)} 0.5`);

  return [`M${WAVE_INSET} 0.5 Q${at(0.5)} -0.5 ${at(1)} 0.5`, ...smooth].join(" ");
};
