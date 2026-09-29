import { Link } from "@tanstack/react-router";
import { ArrowUpRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

// From the hero of `/profile` to the User's public Profile, as the others see it.
export const ProfilePublicLink = ({ handle }: { handle: string }) => (
  <Button
    variant="outline"
    nativeButton={false}
    render={<Link to="/u/$handle" params={{ handle }} />}
    className="relative shrink-0 rounded-[14px]"
  >
    Profile public
    <ArrowUpRightIcon aria-hidden data-icon="inline-end" />
  </Button>
);
