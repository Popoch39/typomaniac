// A Theme in miniature, painted in the colours of the `data-theme` it sits under: the sidebar and
// its nav, the Run settings, a Text with both carets, a Duel's band. A picture only: its words are
// the card's.
export const ThemePreview = () => (
  <span
    aria-hidden="true"
    className="flex h-37.5 gap-1.5 rounded-[18px] bg-background p-1.5 text-foreground"
  >
    <span className="flex w-11 shrink-0 flex-col gap-1.25 rounded-xl bg-card px-1.5 py-1.75">
      <span className="mb-1 size-3.5 rounded-[5px] bg-brand" />
      <span className="h-2 rounded-full bg-brand" />
      <span className="h-2 rounded-full bg-border" />
      <span className="h-2 rounded-full bg-border" />
      <span className="h-2 rounded-full bg-border" />
    </span>
    <span className="flex min-w-0 grow flex-col gap-1.5">
      <span className="flex justify-center gap-1 pt-0.5">
        <span className="h-2.25 w-5.5 rounded-full bg-brand" />
        <span className="h-2.25 w-5.5 rounded-full bg-card" />
        <span className="h-2.25 w-5.5 rounded-full bg-card" />
      </span>
      <span className="grow overflow-hidden rounded-xl bg-card px-2.5 py-2 font-mono text-[9.5px] leading-[17px] text-pending">
        <span className="text-foreground">le temps passe</span>
        <span className="mx-px -mb-px inline-block h-2.75 w-0.5 bg-caret" /> vite quand on{" "}
        <span className="mx-px -mb-px inline-block h-2.75 w-0.5 bg-opponent-caret" />
        tape sans regarder le clavier
      </span>
      <span className="flex h-6 overflow-hidden rounded-lg font-display text-[10px] font-extrabold">
        <span className="flex w-[56%] items-center bg-brand pl-2 text-on-brand">412</span>
        <span className="flex grow items-center justify-end bg-opponent pr-2 text-on-opponent">
          358
        </span>
      </span>
    </span>
  </span>
);
