import { Link } from "@tanstack/react-router";
import { AtSignIcon, EllipsisVerticalIcon, LogOutIcon, UserRoundIcon } from "lucide-react";

import type { Me } from "@/api/me";
import { useSignOut } from "@/components/auth/use-sign-out";
import { Button } from "@/components/ui/button";
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
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The ⋯ of the User's card: their public Profile (once they have a Handle), the Handle's
// settings, and signing out.
export const UserCardMenu = ({ me }: { me: Me }) => {
  const signOut = useSignOut();
  const locale = useLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={m.sidebar_menu_label({ name: me.name }, { locale })}
            className="rounded-[14px] text-muted-foreground"
          />
        }
      >
        <EllipsisVerticalIcon aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-foreground">{me.handle ? atHandle(me.handle) : me.name}</span>
            <span className="truncate">{me.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
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
        <DropdownMenuItem onClick={signOut}>
          <LogOutIcon />
          {m.sidebar_menu_sign_out({}, { locale })}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
