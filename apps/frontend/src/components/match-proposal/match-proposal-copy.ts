import { lockDurationLabel, queueLockLabel } from "@/lib/queue-lock";
import { numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";
import type { ProposalStage, QueueLock } from "@/stores/duel-store";

// How long both Users have to accept, as the server gives it.
export const PROPOSAL_SECONDS = 10;

// From this many seconds left, the ring and its count turn to the alert colour.
export const ALERT_SECONDS = 3;

// How long the server waits before the User whose opponent declined is back in the Queue.
export const REQUEUE_SECONDS = 3;

// Over without a Duel: the User or their opponent declined or let the time run out.
export const isCancelled = (stage: ProposalStage) =>
  stage !== "pending" && stage !== "accepted" && stage !== "ready";

// Said after the User's Dodge when it locked the Queue: « Queue bloquée 5 min. », after the
// sentence it follows.
const withLock = (sentence: string, queueLock: QueueLock | null, locale: Locale) =>
  queueLock === null
    ? sentence
    : `${sentence} ${m.proposal_locked({ lock: queueLockLabel(queueLock.duration, locale) }, { locale })}`;

// The dialog's title and the line under it, for each stage: the words of the Match found mock-up.
// The opponent not answering, absent from it, takes the words of their declining. The User's
// Dodge says the Queue lock it imposed.
export const proposalHeadline = (
  stage: ProposalStage,
  opponent: string,
  locale: Locale,
  queueLock: QueueLock | null = null,
) => {
  switch (stage) {
    case "pending":
      return {
        title: m.proposal_found_title({}, { locale }),
        subtitle: m.proposal_found_subtitle({}, { locale }),
      };
    case "accepted":
      return {
        title: m.proposal_accepted_title({}, { locale }),
        subtitle: m.proposal_accepted_subtitle({ opponent }, { locale }),
      };
    case "ready":
      return {
        title: m.proposal_ready_title({}, { locale }),
        subtitle: m.proposal_ready_subtitle({}, { locale }),
      };
    case "declined":
      return {
        title: m.proposal_declined_title({}, { locale }),
        subtitle: withLock(m.proposal_declined_subtitle({}, { locale }), queueLock, locale),
      };
    case "missed":
      return {
        title: m.proposal_missed_title({}, { locale }),
        subtitle: withLock(m.proposal_missed_subtitle({}, { locale }), queueLock, locale),
      };
    case "opponent-declined":
      return {
        title: m.proposal_opponent_declined_title({ opponent }, { locale }),
        subtitle: m.proposal_search_goes_on({}, { locale }),
      };
    case "opponent-missed":
      return {
        title: m.proposal_opponent_missed_title({ opponent }, { locale }),
        subtitle: m.proposal_search_goes_on({}, { locale }),
      };
  }
};

// Where a player stands, as their chip says it: their turn to answer, ready, still thinking, out
// after declining or without an answer, or back in the Queue once the other one was.
export type PlayerStatus = "turn" | "ready" | "thinking" | "declined" | "missed" | "requeued";

const PLAYER_STATUS_LABELS: Record<PlayerStatus, (locale: Locale) => string> = {
  turn: (locale) => m.proposal_status_turn({}, { locale }),
  ready: (locale) => m.proposal_status_ready({}, { locale }),
  thinking: (locale) => m.proposal_status_thinking({}, { locale }),
  declined: (locale) => m.proposal_status_declined({}, { locale }),
  missed: (locale) => m.proposal_status_missed({}, { locale }),
  requeued: (locale) => m.proposal_status_requeued({}, { locale }),
};

export const playerStatusLabel = (status: PlayerStatus, locale: Locale) =>
  PLAYER_STATUS_LABELS[status](locale);

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

// Said by the buttons while the User has to answer, when declining would lock the Queue for
// `dodgeLock` ms: « Refuser bloquera la Queue 5 min ».
export const dodgeWarning = (dodgeLock: number, locale: Locale) =>
  m.proposal_dodge_warning({ duration: lockDurationLabel(dodgeLock, locale) }, { locale });

// The Queue locks a Match proposal speaks of: the one declining would impose, while the User has
// to answer, and the one their Dodge imposed.
type ProposalLocks = { dodgeLock?: number | null; queueLock?: QueueLock | null };

// The seconds both Users have to accept, counted and written in the Locale.
const proposalSeconds = (locale: Locale) => ({
  count: PROPOSAL_SECONDS,
  shown: numberFormat(locale).format(PROPOSAL_SECONDS),
});

// What screen readers are told: the opponent and the time to answer, with the warning when
// declining would lock the Queue, then the outcome, and the Queue lock the User's Dodge imposed.
export const proposalAnnouncement = (
  stage: ProposalStage,
  opponent: string,
  locale: Locale,
  { dodgeLock = null, queueLock = null }: ProposalLocks = {},
) => {
  switch (stage) {
    case "pending": {
      const found = m.proposal_announce_found({ opponent, ...proposalSeconds(locale) }, { locale });

      return dodgeLock === null
        ? found
        : m.proposal_announce_warned(
            { found, warning: dodgeWarning(dodgeLock, locale) },
            { locale },
          );
    }

    case "accepted":
      return m.proposal_announce_accepted({ opponent }, { locale });
    case "ready":
      return m.proposal_announce_ready({}, { locale });
    case "declined":
      return withLock(m.proposal_announce_declined({}, { locale }), queueLock, locale);
    case "missed":
      return withLock(m.proposal_announce_missed({}, { locale }), queueLock, locale);
    case "opponent-declined":
      return m.proposal_announce_opponent_declined({ opponent }, { locale });
    case "opponent-missed":
      return m.proposal_announce_opponent_missed({ opponent }, { locale });
  }
};

// What the tab's title blinks to while the User has to answer.
export const proposalTabTitle = (locale: Locale) => m.proposal_found_title({}, { locale });

// The system notification of a Match proposal arriving in a hidden tab.
export const proposalNotification = (opponent: string, locale: Locale) => ({
  title: m.proposal_notification_title({}, { locale }),
  body: m.proposal_notification_body({ opponent, ...proposalSeconds(locale) }, { locale }),
});

// The whole seconds left before `expiresAt`, between 0 and PROPOSAL_SECONDS.
export const secondsLeft = (expiresAt: number, now: number) =>
  Math.min(PROPOSAL_SECONDS, Math.max(0, Math.ceil((expiresAt - now) / 1000)));
