import { useEffect } from "react";

import { sendToServer, useConnectionStore } from "@/stores/connection-store";

// While mounted, this tab tells the server it watches Jouer, on each socket once open: the server
// tells it the Queue's overview meanwhile. Unmounted, it stops.
export const useWatchQueue = () => {
  const open = useConnectionStore((store) => store.status === "open");

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    sendToServer({ type: "watch-queue" });

    return () => sendToServer({ type: "unwatch-queue" });
  }, [open]);
};
