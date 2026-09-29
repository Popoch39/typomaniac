import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Under a Theme's name, its two colours and whose they are: the accent for Toi, then the opponent's.
export const ThemeRoles = () => {
  const locale = useLocale();

  return (
    <span className="flex gap-3.5 pt-0.5 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="size-2.5 rounded-full bg-brand" />
        {m.themes_role_you({}, { locale })}
      </span>
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="size-2.5 rounded-full bg-opponent" />
        {m.themes_role_opponent({}, { locale })}
      </span>
    </span>
  );
};
