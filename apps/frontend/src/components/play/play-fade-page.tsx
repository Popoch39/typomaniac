import { cn } from "cn";
import { type ReactNode, useRef } from "react";

import { usePlayFade } from "@/components/play/use-play-fade";

type PlayFadePageProps = {
  // The other page of Jouer, whence this one fades in.
  from: string;
  className?: string;
  children: ReactNode;
};

// One of Jouer's two pages, as tall as the window: it fades in when the User comes from the other.
export const PlayFadePage = ({ from, className, children }: PlayFadePageProps) => {
  const pageRef = useRef<HTMLElement>(null);

  usePlayFade(pageRef, from);

  return (
    <section ref={pageRef} className={cn("flex flex-1 flex-col", className)}>
      {children}
    </section>
  );
};
