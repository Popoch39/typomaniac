import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { AuthControl } from "@/components/auth/auth-control";
import { OAuthErrorToast } from "@/components/auth/oauth-error-toast";
import { SignInDialog } from "@/components/auth/sign-in-dialog";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

// TanStack Link sets data-status="active" on the current route.
const navLinkClassName = "data-[status=active]:bg-muted";

export const RootLayout = () => (
  <div className="mx-auto flex min-h-svh max-w-5xl flex-col gap-6 p-4">
    <header className="flex items-center justify-between border-b pb-2">
      <nav className="flex gap-1">
        <Button
          variant="ghost"
          nativeButton={false}
          className={navLinkClassName}
          render={<Link to="/" />}
        >
          Accueil
        </Button>
        <Button
          variant="ghost"
          nativeButton={false}
          className={navLinkClassName}
          render={<Link to="/health" />}
        >
          Santé de l'API
        </Button>
      </nav>
      <div className="flex items-center gap-2">
        <AuthControl />
        <ModeToggle />
      </div>
    </header>
    <main>
      <Outlet />
    </main>
    <SignInDialog />
    <OAuthErrorToast />
    <Toaster position="bottom-center" />
    <ReactQueryDevtools buttonPosition="bottom-left" />
    <TanStackRouterDevtools position="bottom-right" />
  </div>
);
