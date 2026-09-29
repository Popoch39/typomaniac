import { useEffect } from "react";

import {
  challengeRefusalMessage,
  sentChallengeEndingMessage,
} from "@/components/challenge/challenge-messages";
import { toast } from "@/lib/toast";
import { onServerMessage } from "@/stores/connection-store";
import { useLocaleStore } from "@/stores/locale-store";

// Says why a Challenge was not sent, and how the User's Challenge ended without a Duel (declined,
// not answered, or its recipient no longer free), on any page.
export const ChallengeNotices = () => {
  useEffect(() => {
    // The Challenge the User sent, until it ends: its `challenge-ended` names only its id.
    let sent: { id: string; handle: string } | null = null;

    return onServerMessage((message) => {
      // In the Locale shown when the message comes, not when the page opened.
      const { locale } = useLocaleStore.getState();

      switch (message.type) {
        case "challenges-snapshot":
          sent =
            message.sent === null ? null : { id: message.sent.id, handle: message.sent.to.handle };
          break;
        case "challenge-sent":
          sent = { id: message.challenge.id, handle: message.challenge.to.handle };
          break;
        case "challenge-refused":
          toast.error(challengeRefusalMessage(message.reason, locale));
          break;
        case "challenge-ended": {
          if (sent?.id !== message.challengeId) {
            break;
          }

          const notice = sentChallengeEndingMessage(sent.handle, message.reason, locale);

          sent = null;

          if (notice !== null) {
            toast.info(notice);
          }

          break;
        }

        default:
          break;
      }
    });
  }, []);

  return null;
};
