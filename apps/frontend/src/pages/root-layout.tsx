import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { LiveActivity } from "@/components/activity/live-activity";
import { AuthControl } from "@/components/auth/auth-control";
import { OAuthErrorToast } from "@/components/auth/oauth-error-toast";
import { SignInDialog } from "@/components/auth/sign-in-dialog";
import { ChallengeNotices } from "@/components/challenge/challenge-notices";
import { DuelOnChallenge } from "@/components/challenge/duel-on-challenge";
import { WaitingChallenges } from "@/components/challenge/waiting-challenges";
import { DuelsNavLink } from "@/components/duel-history/duels-nav-link";
import { FriendsNavLink } from "@/components/friends/friends-nav-link";
import { LiveFriendLists } from "@/components/friends/live-friend-lists";
import { HandleChoiceDialog } from "@/components/handle/handle-choice-dialog";
import { RealtimeConnection } from "@/components/realtime-connection";
import { NavPill } from "@/components/ui/nav-pill";
import { NavPills } from "@/components/ui/nav-pills";
import { Toaster } from "@/components/ui/sonner";

const homeActiveOptions = { exact: true };

export const RootLayout = () => (
  <div className="mx-auto flex min-h-svh max-w-5xl flex-col gap-8 px-4 py-5">
    {/* Wraps on a phone: the nav and the controls do not fit side by side under ~360px. */}
    <header className="flex flex-wrap items-center justify-between gap-3">
      <NavPills label="Navigation principale">
        {/* Home only when on "/" itself: every path starts with it. */}
        <NavPill to="/" activeOptions={homeActiveOptions}>
          Accueil
        </NavPill>
        <DuelsNavLink />
        <FriendsNavLink />
        <NavPill to="/health">Santé de l'API</NavPill>
      </NavPills>
      <div className="flex items-center gap-2">
        <AuthControl />
      </div>
    </header>
    <main>
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
