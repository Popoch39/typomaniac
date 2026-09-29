import { useSuspenseQuery } from "@tanstack/react-query";

import { meQueryOptions } from "@/api/me";
import { OrnamentPicker } from "@/components/ornament/ornament-picker";

// The Ornament picker, on the signed-in User's own Profile only: nothing on another User's.
export const OwnOrnamentPicker = ({ handle }: { handle: string }) => {
  const { data: me } = useSuspenseQuery(meQueryOptions);

  if (me === null || me.handle !== handle) {
    return null;
  }

  // Positioned: drawn over the avatar's Ornament where it overflows, never under it. As wide as the
  // settings column of `/profile`, where the same grid lies.
  return (
    <div className="relative max-w-80">
      <OrnamentPicker me={me} handle={handle} />
    </div>
  );
};
