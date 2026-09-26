// Whether this tab may show system notifications: never asked yet, allowed, refused, or a browser
// without them.
export type NotificationAccess = NotificationPermission | "unsupported";

// What brings a User looking elsewhere back to this tab: its title, and system notifications
// while it is hidden. The browser in the app, a fake in the tests.
export type TabAttention = {
  readTitle: () => string;
  writeTitle: (title: string) => void;
  hidden: () => boolean;
  permission: () => NotificationAccess;
  // Only from a click: browsers ignore a request made without one.
  requestPermission: () => void;
  // Fire and forget: nothing is shown without the permission.
  notify: (title: string, body: string) => void;
};

export const quietTabAttention: TabAttention = {
  readTitle: () => "",
  writeTitle: () => {},
  hidden: () => false,
  permission: () => "unsupported",
  requestPermission: () => {},
  notify: () => {},
};

const notificationsSupported = () => typeof Notification !== "undefined";

// The browser's own: a refused request or a notification the browser will not build is dropped.
// Clicking a notification brings the tab back.
export const browserTabAttention: TabAttention = {
  readTitle: () => document.title,
  writeTitle: (title) => {
    document.title = title;
  },
  hidden: () => document.visibilityState === "hidden",
  permission: () => (notificationsSupported() ? Notification.permission : "unsupported"),
  requestPermission: () => {
    if (notificationsSupported()) {
      void Notification.requestPermission().catch(() => {});
    }
  },
  notify: (title, body) => {
    if (!notificationsSupported()) {
      return;
    }

    try {
      const notification = new Notification(title, { body });

      notification.addEventListener("click", () => {
        window.focus();
        notification.close();
      });
    } catch {
      // Some browsers only build notifications from a service worker: the sound and the title
      // are enough.
    }
  },
};
