import { useLocation } from "@tanstack/react-router";

import { RUN_PATH } from "@/components/play/play-paths";
import { useRunStore } from "@/stores/run-store";

// A Solo Run is being typed on its page: from its first Keystroke until its Result, the Queue
// waited in or not. A Run left unfinished on another page is not being typed.
export const useSoloRunTyping = () => {
  const onRunPage = useLocation({ select: (location) => location.pathname === RUN_PATH });
  const typing = useRunStore((state) => state.startedAt !== null && state.result === null);

  return onRunPage && typing;
};
