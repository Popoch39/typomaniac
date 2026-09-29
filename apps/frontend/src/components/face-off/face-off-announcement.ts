import { COUNT_MS } from "@/components/face-off/face-off-timeline";
import { atHandle } from "@/lib/at-handle";
import { numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";
import { m } from "@/paraglide/messages";

// What screen readers hear of the Countdown, `elapsed` ms into the Duel (negative before the
// start), in the Locale: the Duel and the opponent during the Face-off (`title`: « Duel de
// promotion » for a Promotion Duel), then each second of the 3-2-1, then the start.
export const faceOffAnnouncement = (
  elapsed: number,
  opponentHandle: string,
  locale: Locale,
  title: string = m.face_off_duel({}, { locale }),
) => {
  if (elapsed < -COUNT_MS) {
    return m.face_off_announce({ title, opponent: atHandle(opponentHandle) }, { locale });
  }

  return elapsed < 0
    ? numberFormat(locale).format(Math.ceil(-elapsed / 1000))
    : m.face_off_announce_go({}, { locale });
};
