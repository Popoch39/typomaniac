import type { Me } from "@/api/me";
import { OrnamentPicker } from "@/components/ornament/ornament-picker";
import { PROFILE_SETTINGS_CARD_PAINT } from "@/components/profile/profile-paint";

// The Ornament the User wears, on its card of the settings column.
export const ProfileOrnamentSettings = ({ me, handle }: { me: Me; handle: string }) => (
  <div className={PROFILE_SETTINGS_CARD_PAINT}>
    <OrnamentPicker me={me} handle={handle} />
  </div>
);
