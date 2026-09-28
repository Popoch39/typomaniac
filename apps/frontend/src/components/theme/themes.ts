// The Themes to choose from, in the order of their page, with the words of the "Thèmes" board.
// Their colours live in the stylesheet (src/index.css), one rule per `[data-theme]`, and their inks
// in index.html too, painted before the CSS loads (theme-boot.test.ts keeps them in step).
export const THEMES = [
  {
    id: "corail",
    name: "Corail",
    description: "L'original : corail chaud sur encre, adversaire bleu ciel.",
  },
  {
    id: "lagon",
    name: "Lagon",
    description: "Bleu du large. Les rôles s'inversent : l'adversaire passe au corail.",
  },
  {
    id: "matcha",
    name: "Matcha",
    description: "Vert tendre sur sous-bois, adversaire lilas.",
  },
  {
    id: "lilas",
    name: "Lilas",
    description: "Violet doux sur nuit, adversaire ambre.",
  },
  {
    id: "sakura",
    name: "Sakura",
    description: "Rose poudré sur prune, adversaire menthe.",
  },
  {
    id: "arcade",
    name: "Arcade",
    description: "Magenta et cyan sur noir profond.",
  },
  {
    id: "craie",
    name: "Craie",
    description: "Noir et blanc, rien d'autre. L'adversaire en ambre.",
  },
] as const;

export type Theme = (typeof THEMES)[number];

export type ThemeId = Theme["id"];

// Until one is chosen: the accent the app always had.
export const DEFAULT_THEME = THEMES[0];

export const themeOf = (id: ThemeId): Theme =>
  THEMES.find((theme) => theme.id === id) ?? DEFAULT_THEME;
