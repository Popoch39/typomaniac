import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { onServerMessage } from "@/stores/connection-store";
import { usePlayStore } from "@/stores/play-store";
import { useRunStore } from "@/stores/run-store";

// A Duel found while Duel is not shown is an accepted Challenge, played in this tab (the one that
// accepted, or the one that sent it): wherever the User is, to the Duel screen, which resumes it.
// A Solo Run in progress is dropped. A Duel found from the Queue is already on the Duel screen:
// nothing changes.
export const DuelOnChallenge = () => {
  const navigate = useNavigate();

  useEffect(
    () =>
      onServerMessage((message) => {
        if (message.type !== "duel-found") {
          return;
        }

        const { play, setPlay } = usePlayStore.getState();

        if (play === "solo") {
          useRunStore.getState().next();
          setPlay("duel");
        }

        void navigate({ to: "/" });
      }),
    [navigate],
  );

  return null;
};
