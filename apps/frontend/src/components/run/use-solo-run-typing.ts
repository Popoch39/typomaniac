import { useLocation } from "@tanstack/react-router";

import { useInDuel } from "@/components/duel/use-in-duel";
import { useRunStore } from "@/stores/run-store";

// A Solo Run is being typed on the play page: from its first Keystroke until its Result. A Run left
// unfinished on another page, or under a Duel, is not being typed.
export const useSoloRunTyping = () => {
  const onPlayPage = useLocation({ select: (location) => location.pathname === "/" });
  const inDuel = useInDuel();
  const typing = useRunStore((state) => state.startedAt !== null && state.result === null);

  return onPlayPage && !inDuel && typing;
};
