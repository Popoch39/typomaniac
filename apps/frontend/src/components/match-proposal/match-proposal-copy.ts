import type { ProposalStage } from "@/stores/duel-store";

// How long both Users have to accept, as the server gives it.
export const PROPOSAL_SECONDS = 10;

// From this many seconds left, the ring and its count turn to the alert colour.
export const ALERT_SECONDS = 3;

// The dialog's title and the line under it, for each stage. The words of the Match found mock-up;
// `accepted` tells apart the User who did accept when the time ran out.
export const proposalHeadline = (stage: ProposalStage, opponent: string, accepted: boolean) => {
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
    case "missed":
      return {
        title: "Temps écoulé",
        subtitle: accepted
          ? `${opponent} n'a pas répondu à temps, tu as quitté la file. Aucun TP en jeu.`
          : "Tu n'as pas répondu à temps, tu as quitté la file. Aucun TP en jeu.",
      };
  }
};

// Where a player stands, as their chip says it: their turn to answer, ready, still thinking, or
// out without an answer.
export type PlayerStatus = "turn" | "ready" | "thinking" | "missed";

export const PLAYER_STATUS_LABELS: Record<PlayerStatus, string> = {
  turn: "À toi de répondre",
  ready: "Prêt",
  thinking: "Réfléchit…",
  missed: "Pas de réponse",
};

export const selfStatus = (stage: ProposalStage, accepted: boolean): PlayerStatus => {
  if (accepted) {
    return "ready";
  }

  return stage === "missed" ? "missed" : "turn";
};

export const opponentStatus = (stage: ProposalStage, accepted: boolean): PlayerStatus => {
  if (accepted) {
    return "ready";
  }

  return stage === "missed" ? "missed" : "thinking";
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
    case "missed":
      return "Temps écoulé, tu as quitté la file.";
  }
};

// The whole seconds left before `expiresAt`, between 0 and PROPOSAL_SECONDS.
export const secondsLeft = (expiresAt: number, now: number) =>
  Math.min(PROPOSAL_SECONDS, Math.max(0, Math.ceil((expiresAt - now) / 1000)));
