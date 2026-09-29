import { createBrowserHistory } from "@tanstack/react-router";

import { createAppRouter } from "@/app-router";
import { queryClient } from "@/query-client";

export const router = createAppRouter({
  history: createBrowserHistory(),
  storage: () => window.localStorage,
  languages: navigator.languages,
  queryClient,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
