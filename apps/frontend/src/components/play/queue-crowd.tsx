import { EmptyAvatar } from "@/components/play/empty-avatar";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";

// Three places at most, overlapping, cut out of the card by a ring of its colour.
const PLACE_LOOK = "size-13 bg-on-brand ring-3 ring-primary not-first:-ml-3";

const SHOWN_PLACES = 3;

// The Queue as a crowd: a squircle for each User waiting, up to three, then how many more. Nobody
// in them, never who waits: the size is already said in words, so it is hidden from screen readers.
export const QueueCrowd = ({ size }: { size: number }) => {
  const locale = useLocale();
  const shown = Math.min(size, SHOWN_PLACES);
  const more = size - shown;

  if (shown === 0) {
    return null;
  }

  return (
    <div aria-hidden="true" className="flex shrink-0">
      {Array.from({ length: shown }, (_, index) => (
        <EmptyAvatar key={index} className={PLACE_LOOK} />
      ))}
      {more === 0 ? null : (
        <span
          className={`${PLACE_LOOK} flex items-center justify-center rounded-[33%] font-extrabold text-primary`}
        >
          +{numberFormat(locale).format(more)}
        </span>
      )}
    </div>
  );
};
