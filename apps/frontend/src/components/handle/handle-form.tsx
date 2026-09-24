import { useQueryClient } from "@tanstack/react-query";
import { useActionState, useId, useState } from "react";

import { saveHandle } from "@/api/handle";
import { meQueryOptions } from "@/api/me";
import { HandleCheckMessage } from "@/components/handle/handle-check-message";
import { refusals } from "@/components/handle/handle-refusals";
import { useHandleCheck } from "@/components/handle/use-handle-check";
import { Button } from "@/components/ui/button";

type HandleFormProps = {
  // What the field starts with: the current Handle, or a suggestion drawn from the name.
  initial: string;
  current: string | null;
  submitLabel: string;
  onSaved?: () => void;
};

// Chooses or changes the User's Handle, checked live as it is typed. Once saved, the signed-in User
// in the cache has it: every page sees it at once.
export const HandleForm = ({ initial, current, submitLabel, onSaved }: HandleFormProps) => {
  const queryClient = useQueryClient();
  const [input, setInput] = useState(initial);
  const status = useHandleCheck(input, current);
  const inputId = useId();
  const messageId = useId();

  const [error, submit, pending] = useActionState(
    async (_previous: string | null, form: FormData) => {
      const saved = await saveHandle(String(form.get("handle")));

      if (!saved.ok) {
        return saved.reason ? refusals[saved.reason] : "L'enregistrement a échoué. Réessaie.";
      }

      queryClient.setQueryData(meQueryOptions.queryKey, saved.me);
      onSaved?.();

      return null;
    },
    null,
  );

  const savable = status.kind === "available" || status.kind === "unknown";

  return (
    <form action={submit} className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        className="text-[0.7rem] font-medium text-muted-foreground uppercase"
      >
        Handle
      </label>
      <div className="flex h-9 items-center border border-foreground/15 bg-background focus-within:border-caret focus-within:ring-2 focus-within:ring-caret/30">
        <span aria-hidden="true" className="pl-3 text-muted-foreground">
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
          className="h-full min-w-0 flex-1 bg-transparent pr-3 pl-0.5 text-xs outline-none"
        />
      </div>
      <HandleCheckMessage id={messageId} status={status} />
      {error ? (
        <p role="alert" className="text-[0.7rem] text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={!savable || pending}>
        {submitLabel}
      </Button>
    </form>
  );
};
