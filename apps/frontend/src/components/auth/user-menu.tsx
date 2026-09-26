import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { LogOutIcon, UserIcon } from "lucide-react";
import { toast } from "sonner";

import { meQueryOptions, type Me } from "@/api/me";
import { RankChip } from "@/components/tier/rank-chip";
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
import { UserAvatar } from "@/components/user-avatar/user-avatar";
import { atHandle } from "@/lib/at-handle";
import { authClient } from "@/lib/auth-client";

type UserMenuProps = {
  me: Me;
};

export const UserMenu = ({ me }: UserMenuProps) => {
  const queryClient = useQueryClient();
  // The Handle as everywhere else, the name until one is chosen: the chip and its initials.
  const shownName = me.handle ?? me.name;

  const signOut = async () => {
    const { error } = await authClient.signOut();

    if (error) {
      toast.error("La déconnexion a échoué. Réessaie.");

      return;
    }

    queryClient.setQueryData(meQueryOptions.queryKey, null);
    toast.success("Déconnecté");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            aria-label={`Menu de ${me.name}`}
            className="h-11 gap-2.5 rounded-2xl bg-card py-1 pr-3.5 pl-1"
          />
        }
      >
        <UserAvatar handle={shownName} image={me.image} size="lg" className="size-9" />
        <span className="flex flex-col items-start leading-tight">
          <span className="max-w-32 truncate text-sm font-bold">{shownName}</span>
          {me.rank ? <RankChip rank={me.rank} /> : null}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-foreground">{me.handle ? atHandle(me.handle) : me.name}</span>
            <span className="truncate">{me.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link to="/profile" />}>
          <UserIcon />
          Profil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut}>
          <LogOutIcon />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
