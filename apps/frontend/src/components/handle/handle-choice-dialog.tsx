import { useSuspenseQuery } from "@tanstack/react-query";
import { suggestHandle } from "handle";

import { meQueryOptions } from "@/api/me";
import { HandleForm } from "@/components/handle/handle-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";
import { useAuthStore } from "@/stores/auth-store";

// Right after signing in, and at every visit until chosen: a User without a Handle is asked for
// one. Neither a click outside nor Escape closes it; Plus tard puts it off for this visit, with
// Runs solo only.
export const HandleChoiceDialog = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const deferred = useAuthStore((state) => state.handleChoiceDeferred);
  const setDeferred = useAuthStore((state) => state.setHandleChoiceDeferred);
  const locale = useLocale();

  if (me === null || me.handle !== null) {
    return null;
  }

  return (
    <Dialog open={!deferred} disablePointerDismissal>
      <DialogContent showCloseButton={false} className="gap-6 p-6">
        <DialogHeader className="gap-2">
          <DialogTitle className="text-lg font-bold">
            {m.handle_choice_title({}, { locale })}
          </DialogTitle>
          <DialogDescription>{m.handle_choice_pitch({}, { locale })}</DialogDescription>
        </DialogHeader>
        <HandleForm
          initial={suggestHandle(me.name)}
          current={null}
          submitLabel={m.handle_choice_submit({}, { locale })}
        />
        <Button variant="ghost" onClick={() => setDeferred(true)}>
          {m.handle_choice_later({}, { locale })}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
