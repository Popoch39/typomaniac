import { Link } from "@tanstack/react-router";

import { atHandle } from "@/lib/at-handle";
import { cn } from "cn";

type HandleLinkProps = { handle: string; className?: string };

// A Handle standing for another User: the way to their Profile.
export const HandleLink = ({ handle, className }: HandleLinkProps) => (
  <Link
    to="/u/$handle"
    params={{ handle }}
    className={cn("underline-offset-4 hover:underline focus-visible:underline", className)}
  >
    {atHandle(handle)}
  </Link>
);
