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
import { useAuthStore } from "@/stores/auth-store";

// Right after signing in, and at every visit until chosen: a User without a Handle is asked for
// one. Neither a click outside nor Escape closes it; Plus tard puts it off for this visit, with
// Runs solo only.
export const HandleChoiceDialog = () => {
  const { data: me } = useSuspenseQuery(meQueryOptions);
  const deferred = useAuthStore((state) => state.handleChoiceDeferred);
  const setDeferred = useAuthStore((state) => state.setHandleChoiceDeferred);

  if (me === null || me.handle !== null) {
    return null;
  }

  return (
    <Dialog open={!deferred} disablePointerDismissal>
      <DialogContent showCloseButton={false} className="gap-6 p-6">
        <DialogHeader className="gap-2">
          <DialogTitle className="text-lg font-bold">Choisis ton Handle</DialogTitle>
          <DialogDescription>
            Ton nom public : c'est lui que voient tes adversaires en Duel, jamais ton nom ni ton
            email. Tu pourras le changer depuis ton profil.
          </DialogDescription>
        </DialogHeader>
        <HandleForm initial={suggestHandle(me.name)} current={null} submitLabel="C'est parti" />
        <Button variant="ghost" onClick={() => setDeferred(true)}>
          Plus tard
        </Button>
      </DialogContent>
    </Dialog>
  );
};
