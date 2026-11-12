/**
 * @file tab-sync 广播中间件：通过 BroadcastChannel 在多个标签页之间同步状态变更。
 */

import type { Middleware } from "@slux/store";
import type { BroadcastMessage, BroadcastOptions } from "./types.js";

/**
 * 校验未知数据是否为合法的 BroadcastMessage 结构，作为跨标签页消息的窄化守卫。
 * @param data 通道事件携带的原始数据，结构不可信
 * @returns 可按 BroadcastMessage<T> 读取时为 true
 */
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

/**
 * 生成本标签页的发送方标识：优先 crypto.randomUUID，缺失时回退到随机数串。
 */
function generateSenderId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `fallback-${Math.random().toString(36).slice(2)}`;
}

/**
 * 创建一个跨标签页广播中间件：把本地状态变更广播到同通道的其他标签页，并应用来自远端的变更。
 * @param options 配置：channel 通道名（必填）、filter 裁剪广播内容、conflictResolution 冲突策略（默认 "last-write-wins"）
 * @returns Middleware<T> 中间件对象
 * @remarks 宿主无 BroadcastChannel 时整体降级为不同步、不抛错；应用远端状态期间以 applyingRemote
 *          抑制 onSet 回播，防止同一变更在各标签页间形成回环；广播发生在 next 之后以读取到最新状态。
 * @see isBroadcastMessage
 */
export function broadcast<T extends object>(options: BroadcastOptions<T>): Middleware<T> {
  const { channel: channelName, filter, conflictResolution = "last-write-wins" } = options;
  // 本标签页标识，随消息发出并在接收时用于过滤自身消息。
  const senderId = generateSenderId();
  // 通道句柄，init 创建、onDestroy 关闭；未建立或环境不支持时为 undefined。
  let channel: BroadcastChannel | undefined;
  // 为真时 onSet 不回播，切断「接收→setState→onSet→广播」的回环。
  let applyingRemote = false;
  // 最近一次已接受的远端时间戳，仅 timestamp 策略使用；本地更新不推进该值。
  let lastRemoteTimestamp = 0;

  return {
    /** 中间件名称，用于标识。 */
    name: "tab-sync",
    /**
     * init：创建 BroadcastChannel 并注册消息处理器。
     */
    init(api) {
      // 宿主不提供 BroadcastChannel 时静默降级为不同步。
      if (typeof BroadcastChannel === "undefined") return;
      channel = new BroadcastChannel(channelName);
      channel.onmessage = (event) => {
        const message: unknown = event.data;
        // 结构不合法或来自自身时忽略。
        if (!isBroadcastMessage<T>(message) || message.senderId === senderId) return;
        if (conflictResolution === "timestamp") {
          // 只接受比最近已接受值更新的远端消息。
          if (message.timestamp <= lastRemoteTimestamp) return;
          lastRemoteTimestamp = message.timestamp;
        }
        const partial = typeof conflictResolution === "function" ? conflictResolution(message.state, api.getState()) : message.state;
        // 先置位再写状态，使随后的 onSet 跳过广播；finally 复位，保证订阅者抛错后不中断后续广播。
        applyingRemote = true;
        try {
          api.setState(partial);
        } finally {
          applyingRemote = false;
        }
      };
    },
    /**
     * onSet：推进状态更新后，把本次变更广播到同通道的其他标签页。
     */
    onSet(api, next, partial) {
      next(partial);
      // 远端应用期间或通道未建立时不广播。
      if (applyingRemote || channel === undefined) return;
      const message: BroadcastMessage<T> = {
        senderId,
        timestamp: Date.now(),
        // 配置了 filter 则广播裁剪后的当前状态，否则广播本次 partial。
        state: filter === undefined ? partial : filter(api.getState()),
      };
      channel.postMessage(message);
    },
    /**
     * onDestroy：关闭通道并复位状态，结束同步。
     */
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
