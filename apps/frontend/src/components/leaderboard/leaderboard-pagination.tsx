import { Link } from "@tanstack/react-router";

import {
  Pagination,
  PaginationContent,
  PaginationFirst,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type LeaderboardPaginationProps = {
  // The Places of the page's first and last rows.
  from: number;
  to: number;
  // How many Users the Leaderboard holds.
  total: number;
  // Where the pages around this one start, null at either end.
  previous: string | null;
  next: string | null;
};

// Under a page of the Leaderboard: the Places it shows, then the first page, the one before and the
// one after, each a link that the URL keeps (going back returns to the page left).
export const LeaderboardPagination = ({
  from,
  to,
  total,
  previous,
  next,
}: LeaderboardPaginationProps) => {
  const locale = useLocale();
  const format = numberFormat(locale);

  return (
    <Pagination
      aria-label={m.leaderboard_pages_label({}, { locale })}
      className="items-center justify-between gap-4"
    >
      <p className="font-mono text-[13px] text-muted-foreground tabular-nums">
        {m.leaderboard_places_range(
          { from: format.format(from), to: format.format(to), total: format.format(total) },
          { locale },
        )}
      </p>
      <PaginationContent>
        <PaginationItem>
          <PaginationFirst
            text={m.leaderboard_first_page({}, { locale })}
            render={
              previous === null ? null : (
                // Exact: the first page's empty search is part of every other page's.
                <Link to="/leaderboard" search={{}} activeOptions={{ exact: true }} />
              )
            }
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationPrevious
            text={m.leaderboard_previous_page({}, { locale })}
            render={
              previous === null ? null : <Link to="/leaderboard" search={{ before: previous }} />
            }
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            text={m.leaderboard_next_page({}, { locale })}
            render={next === null ? null : <Link to="/leaderboard" search={{ after: next }} />}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
