import { Elysia } from "elysia";

import { type AuthHandler, authentication } from "../plugins/authentication";
import { DuelQueue, type DuelQueueConfig } from "./duel-queue";
import { clientMessage, ServerMessage } from "./protocol";

export type DuelRouteConfig = DuelQueueConfig & { auth: AuthHandler; trustProxy: boolean };

// The Duel WebSocket, /api/duel. The `auth` macro runs on the upgrade request: without a
// valid Session it throws, and the upgrade is answered with the API's 401.
export const duelRoute = ({ auth, trustProxy, ...queueConfig }: DuelRouteConfig) => {
  const queue = new DuelQueue(queueConfig);

  return new Elysia({ name: "duel-route", seed: queue })
    .use(authentication(auth, { trustProxy }))
    .ws("/duel", {
      auth: true,
      response: ServerMessage,
      detail: { summary: "Duel Queue and pairing", tags: ["Duel"] },
      open(ws) {
        queue.connect(ws.data.user.id, {
          id: ws.id,
          send: (message) => ws.send(message),
          close: () => ws.close(),
        });
      },
      message(ws, message) {
        if (!clientMessage.Check(message)) {
          ws.send({ type: "invalid-message" });

          return;
        }

        queue.receive(ws.data.user.id, ws.id, message);
      },
      close(ws) {
        queue.disconnect(ws.data.user.id, ws.id);
      },
    });
};
