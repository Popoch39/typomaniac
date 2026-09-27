import { Dialog } from "@base-ui/react/dialog";
import type { Standing } from "ranked";

import { TierUpPopup } from "@/components/tier-up/tier-up-popup";

type TierUpProps = {
  // The rank left and the rank reached, in another Tier or Maniac.
  from: Standing;
  to: Standing;
  // To unmount it: where the focus goes then is the caller's to say.
  onClose: () => void;
};

// Closing is the Tier-up's own to do: Base UI asking to (Échap) is left to its popup.
const kept = () => {};

// A User moving up into a new Tier or Maniac: the whole screen, a modal dialog named by the Tier
// reached, over a page left inert. The old Emblem comes apart, the new Blason lands, then its
// name, the route of the rank and « Continuer », as its Tier's choreography plays it. A click,
// Échap or Entrée goes straight to the end; once there, the same, or « Continuer », closes it.
// Under reduced motion (preferred, or forced), it opens at its end, still.
export const TierUp = ({ from, to, onClose }: TierUpProps) => (
  <Dialog.Root open onOpenChange={kept}>
    <Dialog.Portal>
      <TierUpPopup from={from} to={to} onClose={onClose} />
    </Dialog.Portal>
  </Dialog.Root>
);
