// The Themes to choose from, in the order of their page, with the words of the "Thèmes" board, and
// whether they are dark or light: the scheme of the browser's native controls (scrollbars, fields).
// Their colours live in the stylesheet (src/index.css), one rule per `[data-theme]`, their inks,
// texts, accents, schemes and ids in index.html too, set before the CSS loads (the text and the
// accent paint the Logo waiting in #root), and their ink, text and accent in their tab's icon,
// public/favicons/ (theme-boot.test.ts keeps them all in step).
export const THEMES = [
  {
    id: "coral",
    name: "Corail",
    description: "L'original : corail chaud sur encre, adversaire bleu ciel.",
    scheme: "dark",
  },
  {
    id: "lagoon",
    name: "Lagon",
    description: "Bleu du large. Les rôles s'inversent : l'adversaire passe au corail.",
    scheme: "dark",
  },
  {
    id: "matcha",
    name: "Matcha",
    description: "Vert tendre sur sous-bois, adversaire lilas.",
    scheme: "dark",
  },
  {
    id: "lilac",
    name: "Lilas",
    description: "Violet doux sur nuit, adversaire ambre.",
    scheme: "dark",
  },
  {
    id: "sakura",
    name: "Sakura",
    description: "Rose poudré sur prune, adversaire menthe.",
    scheme: "dark",
  },
  {
    id: "arcade",
    name: "Arcade",
    description: "Magenta et cyan sur noir profond.",
    scheme: "dark",
  },
  {
    id: "chalk",
    name: "Craie",
    description: "Noir et blanc, rien d'autre. L'adversaire en ambre.",
    scheme: "dark",
  },
  {
    id: "paper",
    name: "Papier",
    description: "Le seul clair : encre sur papier, pour taper en plein jour.",
    scheme: "light",
  },
] as const;

export type Theme = (typeof THEMES)[number];

export type ThemeId = Theme["id"];

// Until one is chosen: the accent the app always had.
export const DEFAULT_THEME = THEMES[0];

export const themeOf = (id: ThemeId): Theme =>
  THEMES.find((theme) => theme.id === id) ?? DEFAULT_THEME;
