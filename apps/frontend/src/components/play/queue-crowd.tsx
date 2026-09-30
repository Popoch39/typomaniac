import { UserAvatar } from "@/components/user-avatar/user-avatar";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import type { QueueOverview } from "@/stores/connection-store";

// The avatars overlap, each cut out of the card by a ring of its colour.
const PLACE_LOOK = "size-13 ring-3 ring-primary not-first:-ml-3";

const INITIALS_LOOK = "bg-on-brand text-[22px] font-extrabold text-primary";

// The Queue as a crowd: the avatars of the last three Users to join, the latest first, then how
// many more wait. The size is already said in words: hidden from screen readers.
export const QueueCrowd = ({ overview }: { overview: QueueOverview }) => {
  const locale = useLocale();
  const more = overview.size - overview.waiting.length;

  if (overview.waiting.length === 0) {
    return null;
  }

  return (
    <div aria-hidden="true" className="flex shrink-0">
      {overview.waiting.map(({ handle, image }) => (
        <UserAvatar
          key={handle}
          handle={handle}
          image={image}
          className={PLACE_LOOK}
          fallbackClassName={INITIALS_LOOK}
        />
      ))}
      {more <= 0 ? null : (
        <span
          className={`${PLACE_LOOK} flex items-center justify-center rounded-[33%] bg-on-brand font-extrabold text-primary`}
        >
          +{numberFormat(locale).format(more)}
        </span>
      )}
    </div>
  );
};
