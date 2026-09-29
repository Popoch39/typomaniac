import { useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { DUEL_PATH } from "@/components/duel/duel-path";
import { useInDuelScene } from "@/components/duel-scene/use-in-duel-scene";
import { duelOf, useDuelStore } from "@/stores/duel-store";
import { usePlayStore } from "@/stores/play-store";
import { useRunStore } from "@/stores/run-store";

// A Duel played in this tab takes the screen, on its own URL: the one found in the Queue, and an
// accepted Challenge wherever the User is, whose Solo Run in progress is dropped. Once there, the
// play page is back to Solo: the Queue was left as the Duel started, and only Nouveau Duel joins
// it again (ADR 0012). A Duel left for another page is forfeited (DuelPlace), read from the store
// as it is now: it is shown no more.
export const DuelOnItsUrl = () => {
  const navigate = useNavigate();
  const inDuel = useInDuelScene();
  const onDuelPage = useLocation({ select: (location) => location.pathname === DUEL_PATH });

  useEffect(() => {
    if (onDuelPage) {
      usePlayStore.getState().setPlay("solo");
    }
  }, [onDuelPage]);

  useEffect(() => {
    if (!inDuel || onDuelPage || duelOf(useDuelStore.getState().state) === null) {
      return;
    }

    if (usePlayStore.getState().play === "solo") {
      useRunStore.getState().next();
    }

    void navigate({ to: DUEL_PATH });
  }, [inDuel, onDuelPage, navigate]);

  return null;
};
