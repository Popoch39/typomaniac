// The Themes to choose from, in the order of their page, and whether they are dark or light: the
// scheme of the browser's native controls (scrollbars, fields). Their names and sentences, in the
// Locale, come from theme-text.ts. Their colours live in the stylesheet (src/index.css), one rule
// per `[data-theme]`, their inks, texts, accents, schemes and ids in index.html too, set before the
// CSS loads (the text and the accent paint the Logo waiting in #root), and their ink, text and
// accent in their tab's icon, public/favicons/ (theme-boot.test.ts keeps them all in step).
export const THEMES = [
  { id: "coral", scheme: "dark" },
  { id: "lagoon", scheme: "dark" },
  { id: "matcha", scheme: "dark" },
  { id: "lilac", scheme: "dark" },
  { id: "sakura", scheme: "dark" },
  { id: "arcade", scheme: "dark" },
  { id: "chalk", scheme: "dark" },
  { id: "paper", scheme: "light" },
] as const;

export type Theme = (typeof THEMES)[number];

export type ThemeId = Theme["id"];

// Until one is chosen: the accent the app always had.
export const DEFAULT_THEME = THEMES[0];

export const themeOf = (id: ThemeId): Theme =>
  THEMES.find((theme) => theme.id === id) ?? DEFAULT_THEME;
