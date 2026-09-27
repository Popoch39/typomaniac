import { AuthControl } from "@/components/auth/auth-control";
import { BrandMark } from "@/components/brand-mark";
import { DuelsNavLink } from "@/components/duel-history/duels-nav-link";
import { DuelFormatChip } from "@/components/duel-scene/duel-format-chip";
import { FriendsNavLink } from "@/components/friends/friends-nav-link";
import { ProfileNavLink } from "@/components/profile/profile-nav-link";
import { NavPill } from "@/components/ui/nav-pill";
import { NavPills } from "@/components/ui/nav-pills";

const homeActiveOptions = { exact: true };

type AppHeaderProps = { inDuelScene: boolean };

// The app's header. In the Duel's scene it fades and goes inert, so a stray click never leaves the
// Duel: without Thèmes nor the User's menu, the Duel's format in its place.
export const AppHeader = ({ inDuelScene }: AppHeaderProps) => (
  <header
    inert={inDuelScene}
    className="flex items-center gap-6 duel-scene:h-11 duel-scene:gap-5 duel-scene:opacity-38"
  >
    <BrandMark />
    <NavPills label="Navigation principale">
      {/* Play only when on "/" itself: every path starts with it. */}
      <NavPill to="/" activeOptions={homeActiveOptions}>
        Jouer
      </NavPill>
      <NavPill to="/leaderboard">Classement</NavPill>
      <DuelsNavLink />
      <FriendsNavLink />
      <ProfileNavLink />
      {inDuelScene ? null : <NavPill to="/themes">Thèmes</NavPill>}
    </NavPills>
    <div className="ml-auto flex items-center gap-2">
      {inDuelScene ? <DuelFormatChip /> : <AuthControl />}
    </div>
  </header>
);
