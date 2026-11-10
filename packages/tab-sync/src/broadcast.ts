import type { Middleware } from "@slux/store";
import type { BroadcastMessage, BroadcastOptions } from "./types.js";

function isBroadcastMessage<T>(data: unknown): data is BroadcastMessage<T> {
  if (typeof data !== "object" || data === null) return false;
  const message = data as Record<string, unknown>;
  return (
    typeof message["senderId"] === "string" &&
    typeof message["timestamp"] === "number" &&
    Number.isFinite(message["timestamp"]) &&
    typeof message["state"] === "object" &&
    message["state"] !== null &&
    !Array.isArray(message["state"])
  );
}

function generateSenderId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `fallback-${Math.random().toString(36).slice(2)}`;
}

export function broadcast<T extends object>(options: BroadcastOptions<T>): Middleware<T> {
  const { channel: channelName, filter, conflictResolution = "last-write-wins" } = options;
  const senderId = generateSenderId();
  let channel: BroadcastChannel | undefined;
  let applyingRemote = false;
  let lastRemoteTimestamp = 0;

  return {
    name: "tab-sync",
    init(api) {
      if (typeof BroadcastChannel === "undefined") return;
      channel = new BroadcastChannel(channelName);
      channel.onmessage = (event) => {
        const message: unknown = event.data;
        if (!isBroadcastMessage<T>(message) || message.senderId === senderId) return;
        if (conflictResolution === "timestamp") {
          if (message.timestamp <= lastRemoteTimestamp) return;
          lastRemoteTimestamp = message.timestamp;
        }
        const partial = typeof conflictResolution === "function" ? conflictResolution(message.state, api.getState()) : message.state;
        applyingRemote = true;
        try {
          api.setState(partial);
        } finally {
          // 业务订阅者抛错也不能让后续本地更新永久停止广播。
          applyingRemote = false;
        }
      };
    },
    onSet(api, next, partial) {
      next(partial);
      if (applyingRemote || channel === undefined) return;
      const message: BroadcastMessage<T> = {
        senderId,
        timestamp: Date.now(),
        state: filter === undefined ? partial : filter(api.getState()),
      };
      channel.postMessage(message);
    },
    onDestroy() {
      if (channel !== undefined) {
        channel.onmessage = null;
        channel.close();
        channel = undefined;
      }
      lastRemoteTimestamp = 0;
    },
  };
}
