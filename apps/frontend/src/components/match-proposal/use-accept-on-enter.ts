import { useEffect, useEffectEvent } from "react";

// Entrée accepts wherever the focus is, while `active`. The key does nothing else: the Accepter
// button, when it has the focus, is not pressed a second time.
export const useAcceptOnEnter = (active: boolean, onAccept: () => void) => {
  const accept = useEffectEvent(onAccept);

  useEffect(() => {
    if (!active) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && !event.repeat) {
        event.preventDefault();
        accept();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [active]);
};
