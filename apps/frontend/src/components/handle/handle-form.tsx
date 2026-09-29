import { useQueryClient } from "@tanstack/react-query";
import { useActionState, useId, useState } from "react";

import { type HandleUnavailable, saveHandle } from "@/api/handle";
import { meQueryOptions } from "@/api/me";
import { HandleCheckMessage } from "@/components/handle/handle-check-message";
import { refusalMessage } from "@/components/handle/handle-refusals";
import { useHandleCheck } from "@/components/handle/use-handle-check";
import { SMALL_TITLE_PAINT } from "@/components/small-title-paint";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type HandleFormProps = {
  // What the field starts with: the current Handle, or a suggestion drawn from the name.
  initial: string;
  current: string | null;
  submitLabel: string;
  onSaved?: () => void;
};

// Why a save failed: a refusal of the Handle, or "failed" when the API gave no reason.
type SaveFailure = HandleUnavailable | "failed";

// Chooses or changes the User's Handle, checked live as it is typed. Once saved, the signed-in User
// in the cache has it: every page sees it at once.
export const HandleForm = ({ initial, current, submitLabel, onSaved }: HandleFormProps) => {
  const queryClient = useQueryClient();
  const [input, setInput] = useState(initial);
  const status = useHandleCheck(input, current);
  const inputId = useId();
  const messageId = useId();
  const locale = useLocale();

  // Kept as a reason, not a text: it is said in the Locale of the moment.
  const [failure, submit, pending] = useActionState(
    async (_previous: SaveFailure | null, form: FormData): Promise<SaveFailure | null> => {
      const saved = await saveHandle(String(form.get("handle")));

      if (!saved.ok) {
        return saved.reason ?? "failed";
      }

      queryClient.setQueryData(meQueryOptions.queryKey, saved.me);
      onSaved?.();

      return null;
    },
    null,
  );

  const savable = status.kind === "available" || status.kind === "unknown";

  return (
    <form action={submit} className="flex flex-col gap-3">
      <label htmlFor={inputId} className={SMALL_TITLE_PAINT}>
        {m.handle_label({}, { locale })}
      </label>
      <div className="flex gap-2">
        <div className="flex h-11 min-w-0 flex-1 items-center gap-0.5 rounded-[14px] bg-surface-2 px-3.5 text-[15px] focus-within:ring-3 focus-within:ring-ring/50">
          <span aria-hidden="true" className="text-muted-foreground">
            @
          </span>
          <input
            id={inputId}
            name="handle"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-describedby={messageId}
            aria-invalid={status.kind === "refused"}
            className="h-full min-w-0 flex-1 bg-transparent font-semibold outline-none"
          />
        </div>
        <Button type="submit" disabled={!savable || pending} className="rounded-[14px] font-bold">
          {submitLabel}
        </Button>
      </div>
      <HandleCheckMessage id={messageId} status={status} />
      {failure === null ? null : (
        <p role="alert" className="text-[0.7rem] text-destructive">
          {failure === "failed"
            ? m.handle_save_failed({}, { locale })
            : refusalMessage(failure, locale)}
        </p>
      )}
    </form>
  );
};
