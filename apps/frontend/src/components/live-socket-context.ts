import { createContext, use } from "react";

import { openApiSocket, type OpenLiveSocket } from "@/stores/connection-store";

// Split out of the components so their files only export components (react/only-export-components).

// How RealtimeConnection opens the app's socket. Injected: the API's by default, a fake server's in
// the tests that render the whole app for a User.
export const LiveSocketContext = createContext<OpenLiveSocket>(openApiSocket);

export const useOpenLiveSocket = () => use(LiveSocketContext);
