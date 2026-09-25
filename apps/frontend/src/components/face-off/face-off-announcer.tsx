import { faceOffAnnouncement } from "@/components/face-off/face-off-announcement";

type FaceOffAnnouncerProps = { elapsed: number; opponentHandle: string };

// The Countdown for screen readers, in place of the Duel clock's: who the opponent is, each
// second of the 3-2-1, then the start.
export const FaceOffAnnouncer = ({ elapsed, opponentHandle }: FaceOffAnnouncerProps) => (
  <output aria-live="assertive" aria-atomic className="sr-only">
    {faceOffAnnouncement(elapsed, opponentHandle)}
  </output>
);
