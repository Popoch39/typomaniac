import { SearchIcon } from "lucide-react";
import { useState } from "react";

import { UserSearchResults } from "@/components/friends/user-search-results";
import { SMALL_TITLE_PAINT } from "@/components/small-title-paint";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Waits this long after the last key before searching.
const SEARCH_DELAY_MS = 300;

type UserSearchProps = {
  // The id of the search field, so the page can bring the User to it.
  inputId: string;
};

// Finds a User by the start of their Handle, updated as it is typed.
export const UserSearch = ({ inputId }: UserSearchProps) => {
  const [input, setInput] = useState("");
  const typed = input.trim().replace(/^@/, "");
  const handle = useDebouncedValue(typed, SEARCH_DELAY_MS);
  const locale = useLocale();

  return (
    <section className="flex flex-col gap-2.5">
      <label htmlFor={inputId} className={SMALL_TITLE_PAINT}>
        {m.friends_search_label({}, { locale })}
      </label>
      <div className="flex h-12 items-center gap-2.5 rounded-full bg-card px-4.5 focus-within:ring-2 focus-within:ring-ring">
        <SearchIcon aria-hidden="true" className="size-4.5 text-muted-foreground" />
        <input
          id={inputId}
          type="search"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={m.friends_search_placeholder({}, { locale })}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
        />
      </div>
      <UserSearchResults typed={typed} handle={handle} />
    </section>
  );
};
