import type { ProposalStage } from "@/stores/duel-store";

// How long both Users have to accept, as the server gives it.
export const PROPOSAL_SECONDS = 10;

// From this many seconds left, the ring and its count turn to the alert colour.
export const ALERT_SECONDS = 3;

// How long the server waits before the User whose opponent declined is back in the Queue.
export const REQUEUE_SECONDS = 3;

// Over without a Duel: the User or their opponent declined or let the time run out.
export const isCancelled = (stage: ProposalStage) =>
  stage !== "pending" && stage !== "accepted" && stage !== "ready";

// The line under the title when the opponent is at fault.
const SEARCH_GOES_ON = "Tu gardes ta place en tête de file, la recherche reprend.";

// The dialog's title and the line under it, for each stage: the words of the Match found mock-up.
// The opponent not answering, absent from it, takes the words of their declining.
export const proposalHeadline = (stage: ProposalStage, opponent: string) => {
  switch (stage) {
    case "pending":
      return {
        title: "Adversaire trouvé !",
        subtitle: "Accepte avant la fin du compte à rebours.",
      };
    case "accepted":
      return { title: "Accepté", subtitle: `On attend la réponse de ${opponent}.` };
    case "ready":
      return {
        title: "C'est parti !",
        subtitle: "Vous avez accepté tous les deux. Le Face-off commence.",
      };
    case "declined":
      return { title: "Duel refusé", subtitle: "Tu as quitté la file. Aucun TP en jeu." };
    case "missed":
      return {
        title: "Temps écoulé",
        subtitle: "Tu n'as pas répondu à temps, tu as quitté la file. Aucun TP en jeu.",
      };
    case "opponent-declined":
      return { title: `${opponent} a refusé`, subtitle: SEARCH_GOES_ON };
    case "opponent-missed":
      return { title: `${opponent} n'a pas répondu`, subtitle: SEARCH_GOES_ON };
  }
};

// Where a player stands, as their chip says it: their turn to answer, ready, still thinking, out
// after declining or without an answer, or back in the Queue once the other one was.
export type PlayerStatus = "turn" | "ready" | "thinking" | "declined" | "missed" | "requeued";

export const PLAYER_STATUS_LABELS: Record<PlayerStatus, string> = {
  turn: "À toi de répondre",
  ready: "Prêt",
  thinking: "Réfléchit…",
  declined: "Refusé",
  missed: "Pas de réponse",
  requeued: "Remis en file",
};

export const selfStatus = (stage: ProposalStage, accepted: boolean): PlayerStatus => {
  switch (stage) {
    case "declined":
    case "missed":
      return stage;
    case "opponent-declined":
    case "opponent-missed":
      return accepted ? "ready" : "requeued";
    case "pending":
    case "accepted":
    case "ready":
      return accepted ? "ready" : "turn";
  }
};

export const opponentStatus = (stage: ProposalStage, accepted: boolean): PlayerStatus => {
  switch (stage) {
    case "declined":
    case "missed":
      return "requeued";
    case "opponent-declined":
      return "declined";
    case "opponent-missed":
      return "missed";
    case "pending":
    case "accepted":
    case "ready":
      return accepted ? "ready" : "thinking";
  }
};

// What screen readers are told: the opponent and the time to answer, then the outcome.
export const proposalAnnouncement = (stage: ProposalStage, opponent: string) => {
  switch (stage) {
    case "pending":
      return `Adversaire trouvé : ${opponent}, ${PROPOSAL_SECONDS} secondes pour accepter`;
    case "accepted":
      return `Accepté, on attend la réponse de ${opponent}`;
    case "ready":
      return "C'est parti ! Le Face-off commence.";
    case "declined":
      return "Duel refusé, tu as quitté la file.";
    case "missed":
      return "Temps écoulé, tu as quitté la file.";
    case "opponent-declined":
      return `${opponent} a refusé, la recherche reprend.`;
    case "opponent-missed":
      return `${opponent} n'a pas répondu, la recherche reprend.`;
  }
};

// What the tab's title blinks to while the User has to answer.
export const PROPOSAL_TAB_TITLE = "Adversaire trouvé !";

// The system notification of a Match proposal arriving in a hidden tab.
export const proposalNotification = (opponent: string) => ({
  title: "Adversaire trouvé",
  body: `${opponent} t'attend : ${PROPOSAL_SECONDS} secondes pour accepter.`,
});

// The whole seconds left before `expiresAt`, between 0 and PROPOSAL_SECONDS.
export const secondsLeft = (expiresAt: number, now: number) =>
  Math.min(PROPOSAL_SECONDS, Math.max(0, Math.ceil((expiresAt - now) / 1000)));
