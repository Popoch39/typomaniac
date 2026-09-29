import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";

// How many Friend requests wait for the User's answer, in a badge after their title.
export const FriendRequestsCount = ({ count }: { count: number }) => {
  const locale = useLocale();

  return (
    <span className="rounded-full bg-brand px-1.75 py-0.5 font-sans text-[11px] font-bold tracking-normal text-on-brand">
      {numberFormat(locale).format(count)}
    </span>
  );
};
