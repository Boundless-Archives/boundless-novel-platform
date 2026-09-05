import { defaultCache } from "@serwist/next/worker";
import type {
  PrecacheEntry,
  SerwistGlobalConfig,
} from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope
    extends SerwistGlobalConfig {
    __SW_MANIFEST:
      | (PrecacheEntry | string)[]
      | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,

  fallbacks: {
    entries: [
      {
        url: "/downloads",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

self.addEventListener(
  "push",
  (event: PushEvent) => {
    if (!event.data) {
      return;
    }

    const data = event.data.json();

    const title =
      data.title ?? "Boundless";

    const options: NotificationOptions = {
      body:
        data.body ??
        "You have a new notification.",
      icon:
        data.icon ??
        "/icon/icon-192.png",
      badge:
        data.badge ??
        "/icon/icon-192.png",
      data: {
        url: data.url ?? "/notifications",
      },
    };

    event.waitUntil(
      self.registration.showNotification(
        title,
        options
      )
    );
  }
);

self.addEventListener(
  "notificationclick",
  (event: NotificationEvent) => {
    event.notification.close();

    const url =
      event.notification.data?.url ??
      "/notifications";

    event.waitUntil(
      self.clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })
        .then((clients) => {
          for (const client of clients) {
            if ("focus" in client) {
              client.navigate(url);
              return client.focus();
            }
          }

          if (self.clients.openWindow) {
            return self.clients.openWindow(url);
          }

          return undefined;
        })
    );
  }
);

serwist.addEventListeners();