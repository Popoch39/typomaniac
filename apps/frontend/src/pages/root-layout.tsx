import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { lazy, Suspense } from "react";

import { LiveActivity } from "@/components/activity/live-activity";
import { AppFrame } from "@/components/app-frame";
import { OAuthErrorToast } from "@/components/auth/oauth-error-toast";
import { ChallengeNotices } from "@/components/challenge/challenge-notices";
import { DuelOnItsUrl } from "@/components/duel/duel-on-its-url";
import { DuelPlace } from "@/components/duel/duel-place";
import { DuelPreload } from "@/components/duel/duel-preload";
import { DesktopOnly } from "@/components/desktop-only";
import { WaitingChallenges } from "@/components/challenge/waiting-challenges";
import { LiveFriendLists } from "@/components/friends/live-friend-lists";
import { QueueProposal } from "@/components/match-proposal/queue-proposal";
import { DocumentLocale } from "@/components/locale/document-locale";
import { QueuePill } from "@/components/queue-pill/queue-pill";
import { RealtimeConnection } from "@/components/realtime-connection";
import { SearchFormRecorder } from "@/components/search-morph/search-form-recorder";
import { DocumentTheme } from "@/components/theme/document-theme";
import { LiveRank } from "@/components/tier/rank/live-rank";
import { TierSprite } from "@/components/tier/sprite/tier-sprite";
import { Toaster } from "@/components/ui/sonner";

// Out of the entry chunk: both are fetched right after the first render, closed until then.
const SignInDialog = lazy(async () => ({
  default: (await import("@/components/auth/sign-in-dialog")).SignInDialog,
}));

const HandleChoiceDialog = lazy(async () => ({
  default: (await import("@/components/handle/handle-choice-dialog")).HandleChoiceDialog,
}));

// Toasts, Challenge cards, the Queue pill and dialogs stay out of the Duel's scene (AppFrame), as
// they are fixed.
export const RootLayout = () => (
  <>
    <DocumentLocale />
    <DocumentTheme />
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
    <DuelPlace />
    <SearchFormRecorder />
    <QueuePill />
    <QueueProposal />
    <DuelOnItsUrl />
    <DuelPreload />
    <Suspense fallback={null}>
      <SignInDialog />
      <HandleChoiceDialog />
    </Suspense>
    <OAuthErrorToast />
    <Toaster position="bottom-center" />
    <ReactQueryDevtools buttonPosition="bottom-left" />
    <TanStackRouterDevtools position="bottom-right" />
  </>
);
