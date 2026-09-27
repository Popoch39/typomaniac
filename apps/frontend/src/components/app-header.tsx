import { AuthControl } from "@/components/auth/auth-control";
import { BrandMark } from "@/components/brand-mark";
import { DuelsNavLink } from "@/components/duel-history/duels-nav-link";
import { DuelFormatChip } from "@/components/duel-scene/duel-format-chip";
import { FriendsNavLink } from "@/components/friends/friends-nav-link";
import { ProfileNavLink } from "@/components/profile/profile-nav-link";
import { NavPill } from "@/components/ui/nav-pill";
import { NavPills } from "@/components/ui/nav-pills";

const homeActiveOptions = { exact: true };

// The Duel whose scene the header tops: whether it is a Challenge.
export type DuelFormat = { challenge: boolean };

// `duelFormat` is null outside the Duel's scene.
type AppHeaderProps = { duelFormat: DuelFormat | null };

// The app's header. In the Duel's scene it fades and goes inert, so a stray click never leaves the
// Duel: without Thèmes nor the User's menu, the Duel's format in its place.
export const AppHeader = ({ duelFormat }: AppHeaderProps) => (
  <header
    inert={duelFormat !== null}
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
      {duelFormat === null ? <NavPill to="/themes">Thèmes</NavPill> : null}
    </NavPills>
    <div className="ml-auto flex items-center gap-2">
      {duelFormat === null ? <AuthControl /> : <DuelFormatChip challenge={duelFormat.challenge} />}
    </div>
  </header>
);
