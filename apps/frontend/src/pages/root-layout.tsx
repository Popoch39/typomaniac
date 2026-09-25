import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { LiveActivity } from "@/components/activity/live-activity";
import { AuthControl } from "@/components/auth/auth-control";
import { OAuthErrorToast } from "@/components/auth/oauth-error-toast";
import { SignInDialog } from "@/components/auth/sign-in-dialog";
import { BrandMark } from "@/components/brand-mark";
import { ChallengeNotices } from "@/components/challenge/challenge-notices";
import { DuelOnChallenge } from "@/components/challenge/duel-on-challenge";
import { DesktopOnly } from "@/components/desktop-only";
import { WaitingChallenges } from "@/components/challenge/waiting-challenges";
import { DuelsNavLink } from "@/components/duel-history/duels-nav-link";
import { FriendsNavLink } from "@/components/friends/friends-nav-link";
import { LiveFriendLists } from "@/components/friends/live-friend-lists";
import { HandleChoiceDialog } from "@/components/handle/handle-choice-dialog";
import { ProfileNavLink } from "@/components/profile/profile-nav-link";
import { RealtimeConnection } from "@/components/realtime-connection";
import { NavPill } from "@/components/ui/nav-pill";
import { NavPills } from "@/components/ui/nav-pills";
import { Toaster } from "@/components/ui/sonner";

const homeActiveOptions = { exact: true };

export const RootLayout = () => (
  <div className="mx-auto flex min-h-svh w-full max-w-7xl flex-col gap-5 px-8 py-6">
    <DesktopOnly />
    <header className="flex items-center gap-6">
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
        <NavPill to="/themes">Thèmes</NavPill>
      </NavPills>
      <div className="ml-auto flex items-center gap-2">
        <AuthControl />
      </div>
    </header>
    <main className="flex flex-1 flex-col">
      <Outlet />
    </main>
    <RealtimeConnection />
    <LiveFriendLists />
    <LiveActivity />
    <WaitingChallenges />
    <ChallengeNotices />
    <DuelOnChallenge />
    <SignInDialog />
    <HandleChoiceDialog />
    <OAuthErrorToast />
    <Toaster position="bottom-center" />
    <ReactQueryDevtools buttonPosition="bottom-left" />
    <TanStackRouterDevtools position="bottom-right" />
  </div>
);
