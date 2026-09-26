import { useEffect, useRef } from "react";

import { useFaceOffSounds } from "@/components/face-off/face-off-sounds-context";
import { proposalNotification } from "@/components/match-proposal/match-proposal-copy";
import { useTabAttention } from "@/components/tab-attention/tab-attention-context";
import type { ProposalStage } from "@/stores/duel-store";
import { useFaceOffSoundStore } from "@/stores/face-off-sound-store";

// Once, when a Match proposal arrives waiting for an answer: its sound, unless the Face-off is
// muted, and a system notification if the tab is hidden and allowed to show one. One that comes
// back already answered (after a lost connection) says nothing.
export const useProposalArrival = (stage: ProposalStage, opponent: string) => {
  const sounds = useFaceOffSounds();
  const attention = useTabAttention();
  // Kept across the effect's reruns (Strict Mode, a new stage): the arrival is told once.
  const told = useRef(false);

  useEffect(() => {
    if (told.current || stage !== "pending") {
      return;
    }

    told.current = true;

    if (!useFaceOffSoundStore.getState().muted) {
      sounds.play("proposal");
    }

    if (attention.hidden() && attention.permission() === "granted") {
      const { title, body } = proposalNotification(opponent);

      attention.notify(title, body);
    }
  }, [attention, opponent, sounds, stage]);
};
