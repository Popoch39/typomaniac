import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";

// How many Friend requests wait for the User's answer, in a badge of the accent after their tab's
// label.
export const FriendRequestsCount = ({ count }: { count: number }) => {
  const locale = useLocale();

  return (
    <span className="ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 font-mono text-[11px] font-bold text-on-brand">
      {numberFormat(locale).format(count)}
    </span>
  );
};
