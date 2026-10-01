// The colours of the History (B · Journal), on the Theme's tokens: the accent heats the frieze. A
// day without a Duel sits between the card and the raised surface; written out whole, for Tailwind
// to find each class.

// The five heats of a day on the frieze, from no Duel to four or more: the accent over the cold.
export const HEAT_PAINT = [
  "bg-[color-mix(in_srgb,var(--surface-2)_60%,var(--surface))]",
  "bg-[color-mix(in_srgb,var(--brand)_25%,color-mix(in_srgb,var(--surface-2)_60%,var(--surface)))]",
  "bg-[color-mix(in_srgb,var(--brand)_50%,color-mix(in_srgb,var(--surface-2)_60%,var(--surface)))]",
  "bg-[color-mix(in_srgb,var(--brand)_75%,color-mix(in_srgb,var(--surface-2)_60%,var(--surface)))]",
  "bg-brand",
] as const;

// A day still to come: only its outline.
export const FUTURE_DAY_PAINT = "bg-transparent inset-ring inset-ring-surface-2";

// A card of the week under the pointer.
export const CARD_HOVER_PAINT = "hover:bg-[color-mix(in_srgb,var(--surface-2)_60%,var(--surface))]";
