import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { meQueryOptions } from "@/api/me";
import { useConnectionStore } from "@/stores/connection-store";

// The app's real-time connection (ADR 0007), open on every page while a User is signed in, and
// opened again for another User: a Visitor has none. Never makes the layout wait for the User.
export const RealtimeConnection = () => {
  const { data: me } = useQuery(meQueryOptions);
  const open = useConnectionStore((store) => store.open);
  const close = useConnectionStore((store) => store.close);

  const userId = me?.id ?? null;

  useEffect(() => {
    if (userId === null) {
      return;
    }

    open();

    return close;
  }, [userId, open, close]);

  return null;
};
