import { useEffect } from "react";

import { BridgedFaceOff } from "@/components/duel-bridge/bridged-face-off";
import { useClock } from "@/components/run/clock-context";
import { bridgeDuels, useDuelBridgeStore } from "@/stores/duel-bridge-store";

// The Duel's bridge, above the pages and out of the Duel's scene (its parts are fixed or in a
// portal): from « C'est parti ! » to the Face-off's exit, the card the Duel comes from holds the
// screen, then the Face-off, wherever the User is. No moment without one or the other.
export const DuelBridge = () => {
  const clock = useClock();
  const bridged = useDuelBridgeStore((store) => store.bridged);

  useEffect(() => bridgeDuels(clock), [clock]);

  return bridged === null ? null : <BridgedFaceOff key={bridged.id} bridged={bridged} />;
};
