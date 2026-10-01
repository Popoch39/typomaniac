import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";

// How many Users a tab of the Friends page holds, after its label.
export const FriendsTabCount = ({ count }: { count: number }) => {
  const locale = useLocale();

  return <span className="font-mono text-xs">{numberFormat(locale).format(count)}</span>;
};
