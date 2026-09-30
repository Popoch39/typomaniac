import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { AtSignIcon, LogOutIcon, TrophyIcon, UserRoundIcon } from "lucide-react";

import type { Me } from "@/api/me";
import { useSignOut } from "@/components/auth/use-sign-out";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { atHandle } from "@/lib/at-handle";
import { ordinal } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type UserCardMenuProps = Omit<ComponentProps<typeof DropdownMenuTrigger>, "aria-label"> & {
  me: Me;
  // Where it opens: above the User's card, right of their avatar in the Rail.
  side: "top" | "right";
};

// The User's menu, opened by their whole card, or their avatar in the Rail (the trigger's props and
// what it shows): their Place in the Leaderboard (once they are in it), their public Profile (once
// they have a Handle), the Handle's settings, and signing out. Named after the name the card shows.
export const UserCardMenu = ({ me, side, ...triggerProps }: UserCardMenuProps) => {
  const signOut = useSignOut();
  const locale = useLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={m.sidebar_menu_label({ name: me.handle ?? me.name }, { locale })}
        {...triggerProps}
      />
      <DropdownMenuContent side={side} align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-foreground">{me.handle ? atHandle(me.handle) : me.name}</span>
            <span className="truncate">{me.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {me.place === null ? null : (
          <DropdownMenuItem
            render={<Link to="/leaderboard" search={{ at: "me" }} resetScroll={false} />}
          >
            <TrophyIcon />
            <span className="flex-1">{m.sidebar_menu_place({}, { locale })}</span>
            <span className="text-xs font-semibold text-muted-foreground tabular-nums">
              {ordinal(locale, me.place)}
            </span>
          </DropdownMenuItem>
        )}
        {me.handle === null ? null : (
          <DropdownMenuItem render={<Link to="/u/$handle" params={{ handle: me.handle }} />}>
            <UserRoundIcon />
            {m.sidebar_menu_profile({}, { locale })}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem render={<Link to="/profile" />}>
          <AtSignIcon />
          {m.sidebar_menu_handle({}, { locale })}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOutIcon />
          {m.sidebar_menu_sign_out({}, { locale })}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
