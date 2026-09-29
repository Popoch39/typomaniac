import { Link } from "@tanstack/react-router";
import { ArrowUpRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// From the hero of `/profile` to the User's public Profile, as the others see it.
export const ProfilePublicLink = ({ handle }: { handle: string }) => {
  const locale = useLocale();

  return (
    <Button
      variant="outline"
      nativeButton={false}
      render={<Link to="/u/$handle" params={{ handle }} />}
      className="relative shrink-0 rounded-[14px]"
    >
      {m.profile_public_link({}, { locale })}
      <ArrowUpRightIcon aria-hidden data-icon="inline-end" />
    </Button>
  );
};
