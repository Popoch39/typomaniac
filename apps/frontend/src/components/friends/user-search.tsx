import { SearchIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { UserSearchResults } from "@/components/friends/user-search-results";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Waits this long after the last key before searching.
const SEARCH_DELAY_MS = 300;

type UserSearchProps = {
  // The id of the search field, so the page can bring the User to it.
  inputId: string;
};

// Finds a User by the start of their Handle, updated as it is typed: the field in the page's header,
// the Users found on a card dropped over the page under it. The card stays while the User is in the
// search, and closes on Escape or once they go elsewhere.
export const UserSearch = ({ inputId }: UserSearchProps) => {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const typed = input.trim().replace(/^@/, "");
  const handle = useDebouncedValue(typed, SEARCH_DELAY_MS);
  const locale = useLocale();

  // Open while the focus is in the search; closed by Escape, by the focus going elsewhere, or by a
  // click elsewhere on the page, even where nothing takes the focus.
  useEffect(() => {
    const root = rootRef.current;

    if (root === null) {
      return;
    }

    const isOutside = (target: EventTarget | null) =>
      target instanceof Node && !root.contains(target);

    const show = () => setOpen(true);

    // A button disabled while its action runs drops the focus to nowhere: the card stays.
    const hideOnFocusOut = (event: FocusEvent) => {
      if (isOutside(event.relatedTarget)) {
        setOpen(false);
      }
    };

    const hideOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const hideOnClickOutside = (event: PointerEvent) => {
      if (isOutside(event.target)) {
        setOpen(false);
      }
    };

    root.addEventListener("focusin", show);
    root.addEventListener("focusout", hideOnFocusOut);
    root.addEventListener("keydown", hideOnEscape);
    document.addEventListener("pointerdown", hideOnClickOutside);

    return () => {
      root.removeEventListener("focusin", show);
      root.removeEventListener("focusout", hideOnFocusOut);
      root.removeEventListener("keydown", hideOnEscape);
      document.removeEventListener("pointerdown", hideOnClickOutside);
    };
  }, []);

  return (
    <search ref={rootRef} className="relative w-95 shrink-0">
      <label htmlFor={inputId} className="sr-only">
        {m.friends_search_label({}, { locale })}
      </label>
      <div className="flex h-12 items-center gap-2.5 rounded-full bg-card px-4.5 focus-within:ring-2 focus-within:ring-ring">
        <SearchIcon aria-hidden="true" className="size-4.5 text-muted-foreground" />
        <input
          id={inputId}
          type="search"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            // Typing again after Escape brings the card back.
            setOpen(true);
          }}
          placeholder={m.friends_search_placeholder({}, { locale })}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
        />
      </div>
      {open && input !== "" ? (
        <div className="absolute inset-x-0 top-full z-30 mt-2 max-h-[min(24rem,60svh)] overflow-y-auto rounded-[24px] bg-popover p-2.5 shadow-xl ring-1 ring-foreground/10">
          <UserSearchResults typed={typed} handle={handle} />
        </div>
      ) : null}
    </search>
  );
};
