import type { QueryClient } from "@tanstack/react-query";
import { type AnyRouter, createRouter, type RouterHistory } from "@tanstack/react-router";

import { withDevRoutes } from "@/dev-routes";
import { browserLocale } from "@/locale/browser-locale";
import { replaceLocale } from "@/locale/locale-history";
import { localeOfPath, withLocale, withoutLocale } from "@/locale/locale-url";
import { ErrorPage } from "@/pages/error-page";
import { routeTree } from "@/routeTree.gen";
import { readLocaleFrom, useLocaleStore } from "@/stores/locale-store";

// Once per app load: the dev routes extend the tree in place.
const appRouteTree = import.meta.env.DEV ? withDevRoutes(routeTree) : routeTree;

type AppRouterOptions = {
  history: RouterHistory;
  // Where the Locale is kept: the browser's localStorage (whose access may throw), a test's own.
  storage: () => Storage;
  // The browser's languages, most preferred first (`navigator.languages`).
  languages: readonly string[];
  queryClient: QueryClient;
};

// The Locale a visit starts in (ADR 0011): the URL's, else the one kept by this browser, else the
// browser's languages'.
const startLocale = (history: RouterHistory, languages: readonly string[]) =>
  localeOfPath(history.location.pathname) ??
  useLocaleStore.getState().chosen ??
  browserLocale(languages);

// The app's router, for the browser (src/router.ts) and for tests (a memory history, their own
// storage and languages). Every URL starts with the Locale, "/fr/leaderboard": the router's rewrite
// takes it off before matching and puts the Locale shown back on every URL it writes, so the route
// tree never sees it. A URL without it (the root, an old link) is sent to the Locale the visit
// starts in. A first visit keeps its Locale.
export const createAppRouter = ({ history, storage, languages, queryClient }: AppRouterOptions) => {
  readLocaleFrom(storage);

  const locale = startLocale(history, languages);
  const store = useLocaleStore.getState();

  if (localeOfPath(history.location.pathname) !== locale) {
    replaceLocale(history, locale);
  }

  store.show(locale);

  if (store.chosen === null) {
    store.choose(locale);
  }

  // The router itself, once made: its rewrite already runs while it is being made, in the Locale
  // just shown.
  let builtRouter: Pick<AnyRouter, "setRoutes" | "buildRouteTree"> | null = null;

  const router = createRouter({
    routeTree: appRouteTree,
    history,
    context: { queryClient },
    defaultPreload: "intent",
    // React Query owns caching: always let loaders call ensureQueryData on preload.
    defaultPreloadStaleTime: 0,
    // A page that fails to load, where its route has no error screen of its own.
    defaultErrorComponent: ErrorPage,
    rewrite: {
      // Each URL read sets the Locale shown, before its page renders: the switch, and going back
      // and forth between Locales, change the URL only.
      input: ({ url }) => {
        const pathLocale = localeOfPath(url.pathname);
        const current = useLocaleStore.getState();

        // The router keeps each Link's location once built, prefix included, as if it depended
        // on its route tree only: a new Locale makes it build them again. `setRoutes` is where it
        // forgets them.
        if (pathLocale !== null && pathLocale !== current.locale) {
          current.show(pathLocale);
          builtRouter?.setRoutes(builtRouter.buildRouteTree());
        }

        url.pathname = withoutLocale(url.pathname);

        return url;
      },
      output: ({ url }) => {
        url.pathname = withLocale(url.pathname, useLocaleStore.getState().locale);

        return url;
      },
    },
  });

  builtRouter = router;

  return router;
};
