import type { Me } from "@/api/me";
import { UserCardMenu } from "@/components/sidebar/user-card-menu";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar/user-avatar";

// At the bottom of the Rail, in place of the User's card: their avatar, with their Ornament, which
// opens their menu. Their rank waits for the whole sidebar or /profile.
export const RailUserMenu = ({ me }: { me: Me }) => (
  <div className="flex justify-center">
    <UserCardMenu
      me={me}
      side="right"
      render={<Button variant="ghost" size="icon" className="size-11 rounded-[33%] p-0" />}
    >
      <UserAvatar
        handle={me.handle ?? me.name}
        image={me.image}
        ornament={me.ornament}
        size="lg"
        className="size-10"
      />
    </UserCardMenu>
  </div>
);
