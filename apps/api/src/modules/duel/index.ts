import { Elysia } from "elysia";

import { type AuthHandler, authentication } from "../auth";
import type { PresenceEvents } from "../friend/live";
import { clientMessage, DuelModel, type ServerMessage } from "./model";
import { DuelQueue, type DuelQueueConfig } from "./service";

export type DuelModuleConfig = Omit<DuelQueueConfig, "onDuel"> & {
  auth: AuthHandler;
  trustProxy: boolean;
  // Told of each connection and each Duel: the Presence the User's Friends see.
  friendsLive: PresenceEvents;
};

// The Duel WebSocket, /api/duel: the real-time connection of the whole app, one per open tab of a
// User (ADR 0007). The `auth` macro runs on the upgrade request: without a valid Session it throws,
// and the upgrade is answered with the API's 401.
export const duelModule = ({ auth, trustProxy, friendsLive, ...queueConfig }: DuelModuleConfig) => {
  const queue = new DuelQueue({
    ...queueConfig,
    onDuel: (userId, inDuel) => friendsLive.setInDuel(userId, inDuel),
  });

  return new Elysia({ name: "duel", seed: queue })
    .use(authentication(auth, { trustProxy }))
    .ws("/duel", {
      auth: true,
      response: DuelModel.serverMessage,
      detail: { summary: "Duel Queue and pairing, Friends' Presence", tags: ["Duel"] },
      open(ws) {
        const connection = {
          id: ws.id,
          send: (message: ServerMessage) => {
            ws.send(message);
          },
        };

        queue.connect(ws.data.user.id, connection);
        friendsLive.connect(ws.data.user.id, connection);
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
        friendsLive.disconnect(ws.data.user.id, ws.id);
      },
    });
};
