import type { Me } from "@/api/me";
import { ProfileHandleSettings } from "@/components/profile/profile-handle-settings";
import { ProfileOrnamentSettings } from "@/components/profile/profile-ornament-settings";

// The settings column of `/profile`: the Handle, then the Ornament, which only a User with a Handle
// wears.
export const ProfileSettings = ({ me }: { me: Me }) => (
  <>
    <ProfileHandleSettings me={me} />
    {me.handle === null ? null : <ProfileOrnamentSettings me={me} handle={me.handle} />}
  </>
);
