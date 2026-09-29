import { suggestHandle } from "handle";
import { toast } from "sonner";

import type { Me } from "@/api/me";
import { HandleForm } from "@/components/handle/handle-form";
import { PROFILE_SETTINGS_CARD_PAINT } from "@/components/profile/profile-paint";

const onSaved = () => toast.success("Handle enregistré");

// The User's Handle, on its card of the settings column: changed at will, or chosen at last. The
// previous Handle is freed at once; their Duels stay theirs.
export const ProfileHandleSettings = ({ me }: { me: Me }) => (
  <div className={PROFILE_SETTINGS_CARD_PAINT}>
    <HandleForm
      initial={me.handle ?? suggestHandle(me.name)}
      current={me.handle}
      submitLabel="Enregistrer"
      onSaved={onSaved}
    />
    <p className="text-xs leading-normal text-muted-foreground">
      Changer de Handle libère l'ancien aussitôt. Ton historique de Duels te suit.
    </p>
  </div>
);
