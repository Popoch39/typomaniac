// What a Theme changes, and what it leaves alone.
const EFFECTS = [
  { title: "Fond et surfaces", text: "Le fond de page, les cartes et la barre latérale." },
  { title: "Accent", text: "Toi : tes boutons, ton caret, ta moitié du HUD en Duel." },
  { title: "Adversaire", text: "Sa couleur en Duel et en Replay, toujours loin de l'accent." },
  { title: "Tiers", text: "Ils gardent leur couleur, quel que soit le Theme." },
] as const;

// Under the Themes: what choosing one changes.
export const ThemeEffects = () => (
  <section aria-label="Ce que change un Theme" className="grid grid-cols-4 gap-5 px-1.5 pt-1">
    {EFFECTS.map((effect) => (
      <div key={effect.title} className="flex flex-col gap-1.5">
        <h2 className="font-mono text-[0.66rem] font-medium tracking-[0.06em] text-muted-foreground uppercase">
          {effect.title}
        </h2>
        <p className="text-[13px] leading-normal">{effect.text}</p>
      </div>
    ))}
  </section>
);
