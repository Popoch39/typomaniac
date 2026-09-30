import { Link } from "@tanstack/react-router";

import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";

type RailFriendsMoreProps = {
  // The Friends there beyond the Rail's rows.
  more: number;
  // Its name: « Tous tes Friends · N ».
  label: string;
};

// Under the Rail's avatars, « +N », the Friends there it has no room for: the way to all of them.
// Nothing when none is left out, the nav leading to Friends already.
export const RailFriendsMore = ({ more, label }: RailFriendsMoreProps) => {
  const locale = useLocale();

  return more > 0 ? (
    <Link
      to="/friends"
      aria-label={label}
      className="mx-auto flex h-8 min-w-8 items-center justify-center rounded-full bg-sidebar-accent px-2 text-xs font-bold text-muted-foreground tabular-nums hover:text-foreground focus-visible:text-foreground"
    >
      {`+${numberFormat(locale).format(more)}`}
    </Link>
  ) : null;
};
