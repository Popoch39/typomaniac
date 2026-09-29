import { suggestHandle } from "handle";

import type { Me } from "@/api/me";
import { HandleForm } from "@/components/handle/handle-form";
import { PROFILE_SETTINGS_CARD_PAINT } from "@/components/profile/profile-paint";
import { toast } from "@/lib/toast";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The User's Handle, on its card of the settings column: changed at will, or chosen at last. The
// previous Handle is freed at once; their Duels stay theirs.
export const ProfileHandleSettings = ({ me }: { me: Me }) => {
  const locale = useLocale();

  return (
    <div className={PROFILE_SETTINGS_CARD_PAINT}>
      <HandleForm
        initial={me.handle ?? suggestHandle(me.name)}
        current={me.handle}
        submitLabel={m.handle_settings_save({}, { locale })}
        onSaved={() => toast.success(m.handle_settings_saved({}, { locale }))}
      />
      <p className="text-xs leading-normal text-muted-foreground">
        {m.handle_settings_note({}, { locale })}
      </p>
    </div>
  );
};
