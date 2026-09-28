// Under a Theme's name, its two colours and whose they are: the accent for Toi, then the opponent's.
export const ThemeRoles = () => (
  <span className="flex gap-3.5 pt-0.5 text-xs text-muted-foreground">
    <span className="flex items-center gap-1.5">
      <span aria-hidden="true" className="size-2.5 rounded-full bg-brand" />
      Toi
    </span>
    <span className="flex items-center gap-1.5">
      <span aria-hidden="true" className="size-2.5 rounded-full bg-opponent" />
      Adversaire
    </span>
  </span>
);
