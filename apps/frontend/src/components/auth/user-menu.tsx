import { useQueryClient } from "@tanstack/react-query";
import { LogOutIcon } from "lucide-react";
import { toast } from "sonner";

import { meQueryOptions, type Me } from "@/api/me";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { authClient } from "@/lib/auth-client";
import { initials } from "@/lib/initials";

type UserMenuProps = {
  me: Me;
};

export const UserMenu = ({ me }: UserMenuProps) => {
  const queryClient = useQueryClient();

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
        render={<Button variant="ghost" size="icon" aria-label={`Menu de ${me.name}`} />}
      >
        <Avatar size="sm">
          {me.image ? <AvatarImage src={me.image} alt="" /> : null}
          <AvatarFallback>{initials(me.name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-foreground">{me.name}</span>
            <span className="truncate">{me.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOutIcon />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
