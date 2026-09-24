import { SearchIcon } from "lucide-react";
import { useId, useState } from "react";

import { UserSearchResults } from "@/components/friends/user-search-results";
import { useDebouncedValue } from "@/lib/use-debounced-value";

// Waits this long after the last key before searching.
const SEARCH_DELAY_MS = 300;

// Finds a User by the start of their Handle, updated as it is typed.
export const UserSearch = () => {
  const [input, setInput] = useState("");
  const handle = useDebouncedValue(input.trim().replace(/^@/, ""), SEARCH_DELAY_MS);
  const inputId = useId();

  return (
    <section className="flex flex-col gap-3">
      <label
        htmlFor={inputId}
        className="text-[0.7rem] font-medium text-muted-foreground uppercase"
      >
        Chercher un User
      </label>
      <div className="flex h-9 items-center gap-2 border border-foreground/15 bg-background px-3 focus-within:border-caret focus-within:ring-2 focus-within:ring-caret/30">
        <SearchIcon aria-hidden="true" className="size-3.5 text-muted-foreground" />
        <input
          id={inputId}
          type="search"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="@handle"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className="h-full min-w-0 flex-1 bg-transparent text-xs outline-none"
        />
      </div>
      <UserSearchResults handle={handle} />
    </section>
  );
};
