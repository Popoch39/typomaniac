import type { ClientMessage, ServerMessage } from "api";

import type { LiveSocket } from "@/stores/connection-store";

// What the store listens to on its socket.
type SocketListeners = {
  message: (event: { data: ServerMessage }) => void;
  close: () => void;
};

// A socket the test speaks for the server through: it hands the store the server's messages and
// drops the connection.
const fakeSocket = () => {
  const sent: ClientMessage[] = [];
  const listeners: SocketListeners = { message: () => {}, close: () => {} };
  let closed = false;

  const socket: LiveSocket = {
    subscribe: (listener) => {
      listeners.message = listener;
    },
    on: (_, listener) => {
      listeners.close = listener;
    },
    send: (message) => {
      sent.push(message);
    },
    close: () => {
      closed = true;
    },
  };

  return {
    socket,
    sent,
    isClosed: () => closed,
    receive: (data: ServerMessage) => listeners.message({ data }),
    drop: () => listeners.close(),
  };
};

export type FakeSocket = ReturnType<typeof fakeSocket>;

// Every socket a store opens, the first one at the connection, then one per reconnection: `open`
// is what the store is given to open them, `server()` the last one opened.
export const fakeServer = () => {
  const sockets: FakeSocket[] = [];

  const server = () => {
    const current = sockets.at(-1);

    if (typeof current === "undefined") {
      throw new Error("No socket opened");
    }

    return current;
  };

  const open = () => {
    const opened = fakeSocket();

    sockets.push(opened);

    return opened.socket;
  };

  return { sockets, server, open };
};
