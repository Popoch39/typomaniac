import { type ExternalToast, toast as sonner } from "sonner";

import { afterIntro } from "@/stores/intro-store";

type Message = Parameters<typeof sonner.success>[0];

type Show = (message: Message, data?: ExternalToast) => void;

// `show`, held until the Intro is over.
const heldDuringIntro =
  (show: Show): Show =>
  (message, data) =>
    afterIntro(() => show(message, data));

// The app's toasts: sonner's, held while the Intro plays and shown once it is over. Sonner 2 drops
// a toast shown before its Toaster listens, and one shown over the Intro would go unseen.
export const toast = {
  success: heldDuringIntro(sonner.success),
  info: heldDuringIntro(sonner.info),
  error: heldDuringIntro(sonner.error),
};
