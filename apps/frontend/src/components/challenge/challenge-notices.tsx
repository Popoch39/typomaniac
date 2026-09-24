import { useEffect } from "react";
import { toast } from "sonner";

import {
  challengeRefusalMessage,
  sentChallengeEndingMessage,
} from "@/components/challenge/challenge-messages";
import { onServerMessage } from "@/stores/connection-store";

// Says why a Challenge was not sent, and how the User's Challenge ended without a Duel (declined,
// not answered, or its recipient no longer free), on any page.
export const ChallengeNotices = () => {
  useEffect(() => {
    // The Challenge the User sent, until it ends: its `challenge-ended` names only its id.
    let sent: { id: string; handle: string } | null = null;

    return onServerMessage((message) => {
      switch (message.type) {
        case "challenges-snapshot":
          sent =
            message.sent === null ? null : { id: message.sent.id, handle: message.sent.to.handle };
          break;
        case "challenge-sent":
          sent = { id: message.challenge.id, handle: message.challenge.to.handle };
          break;
        case "challenge-refused":
          toast.error(challengeRefusalMessage(message.reason));
          break;
        case "challenge-ended": {
          if (sent?.id !== message.challengeId) {
            break;
          }

          const notice = sentChallengeEndingMessage(sent.handle, message.reason);

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
