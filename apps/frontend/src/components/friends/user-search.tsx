import { SearchIcon } from "lucide-react";
import { useState } from "react";

import { UserSearchResults } from "@/components/friends/user-search-results";
import { useDebouncedValue } from "@/lib/use-debounced-value";

// Waits this long after the last key before searching.
const SEARCH_DELAY_MS = 300;

type UserSearchProps = {
  // The id of the search field, so the page can bring the User to it.
  inputId: string;
};

// Finds a User by the start of their Handle, updated as it is typed.
export const UserSearch = ({ inputId }: UserSearchProps) => {
  const [input, setInput] = useState("");
  const handle = useDebouncedValue(input.trim().replace(/^@/, ""), SEARCH_DELAY_MS);

  return (
    <section className="flex flex-col gap-3">
      <label
        htmlFor={inputId}
        className="px-1 font-mono text-[0.7rem] font-medium text-muted-foreground uppercase"
      >
        Chercher un User
      </label>
      <div className="flex h-11 items-center gap-2 rounded-full bg-card px-4 focus-within:ring-2 focus-within:ring-ring">
        <SearchIcon aria-hidden="true" className="size-4 text-muted-foreground" />
        <input
          id={inputId}
          type="search"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="@handle"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-faint"
        />
      </div>
      <UserSearchResults handle={handle} />
    </section>
  );
};
