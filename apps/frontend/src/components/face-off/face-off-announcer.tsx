import { faceOffAnnouncement } from "@/components/face-off/face-off-announcement";

type FaceOffAnnouncerProps = { elapsed: number; opponentHandle: string; title?: string };

// The Countdown for screen readers, in place of the Duel clock's: which Duel, against whom, each
// second of the 3-2-1, then the start.
export const FaceOffAnnouncer = ({ elapsed, opponentHandle, title }: FaceOffAnnouncerProps) => (
  <output aria-live="assertive" aria-atomic className="sr-only">
    {faceOffAnnouncement(elapsed, opponentHandle, title)}
  </output>
);
