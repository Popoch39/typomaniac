import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { LiveActivity } from "@/components/activity/live-activity";
import { AppFrame } from "@/components/app-frame";
import { OAuthErrorToast } from "@/components/auth/oauth-error-toast";
import { SignInDialog } from "@/components/auth/sign-in-dialog";
import { ChallengeNotices } from "@/components/challenge/challenge-notices";
import { DuelOnChallenge } from "@/components/challenge/duel-on-challenge";
import { DesktopOnly } from "@/components/desktop-only";
import { WaitingChallenges } from "@/components/challenge/waiting-challenges";
import { LiveFriendLists } from "@/components/friends/live-friend-lists";
import { HandleChoiceDialog } from "@/components/handle/handle-choice-dialog";
import { RealtimeConnection } from "@/components/realtime-connection";
import { LiveRank } from "@/components/tier/rank/live-rank";
import { TierSprite } from "@/components/tier/sprite/tier-sprite";
import { Toaster } from "@/components/ui/sonner";

// Toasts, Challenge cards and dialogs stay out of the Duel's scene (AppFrame), as they are fixed.
export const RootLayout = () => (
  <>
    <DesktopOnly />
    <TierSprite />
    <AppFrame>
      <Outlet />
    </AppFrame>
    <RealtimeConnection />
    <LiveFriendLists />
    <LiveActivity />
    <LiveRank />
    <WaitingChallenges />
    <ChallengeNotices />
    <DuelOnChallenge />
    <SignInDialog />
    <HandleChoiceDialog />
    <OAuthErrorToast />
    <Toaster position="bottom-center" />
    <ReactQueryDevtools buttonPosition="bottom-left" />
    <TanStackRouterDevtools position="bottom-right" />
  </>
);
