import { createStore } from "@slux/store";
import { afterEach, beforeEach, describe, expect, it, rstest } from "rstack/test";
import { broadcast } from "../src/index.js";
import type { BroadcastOptions } from "../src/index.js";

type State = { count: number; theme: string; increment: () => void };
type Message = { data: unknown };
const channels = new Set<TestChannel>();
let sent: unknown[] = [];

class TestChannel {
  onmessage: ((event: Message) => void) | null = null;
  constructor(readonly name: string) {
    channels.add(this);
  }
  postMessage(data: unknown) {
    const copy = structuredClone(data);
    sent.push(copy);
    for (const peer of channels) {
      if (peer !== this && peer.name === this.name) peer.onmessage?.({ data: copy });
    }
  }
  close() {
    channels.delete(this);
    this.onmessage = null;
  }
}

function makeStore(options: Partial<BroadcastOptions<State>> = {}) {
  return createStore<State>(
    (set) => ({
      count: 0,
      theme: "light",
      increment: () => set((state) => ({ count: state.count + 1 })),
    }),
    { middleware: [broadcast<State>({ channel: "counter", ...options })] },
  );
}

function receive(data: unknown) {
  for (const channel of channels) channel.onmessage?.({ data });
}

beforeEach(() => {
  sent = [];
  channels.clear();
  rstest.stubGlobal("BroadcastChannel", TestChannel);
});
afterEach(() => {
  channels.clear();
  rstest.unstubAllGlobals();
  rstest.restoreAllMocks();
});

describe("broadcast", () => {
  it("同步 action 和函数式更新，保留远端 action，且不会回传循环", () => {
    const a = makeStore();
    const b = makeStore();
    const c = makeStore();
    a.getState().increment();
    expect([a.get().count, b.get().count, c.get().count]).toEqual([1, 1, 1]);
    expect(sent).toHaveLength(1);
    b.setState((state) => ({ count: state.count + 2 }));
    expect(a.get().count).toBe(3);
    expect(c.get().count).toBe(3);
    expect(typeof c.get().increment).toBe("function");
  });

  it("按 channel 隔离，并从更新后完整状态过滤发送字段", () => {
    const a = makeStore({ filter: (state) => ({ theme: state.theme }) });
    const b = makeStore();
    const isolated = makeStore({ channel: "other" });
    a.setState({ count: 10, theme: "dark" });
    expect(b.get()).toMatchObject({ count: 0, theme: "dark" });
    expect(isolated.get()).toMatchObject({ count: 0, theme: "light" });
  });

  it("filter 只控制发送，不过滤接收", () => {
    const a = makeStore({ filter: (state) => ({ theme: state.theme }) });
    receive({ senderId: "remote", timestamp: 10, state: { count: 9 } });
    expect(a.get().count).toBe(9);
    expect(sent).toHaveLength(0);
  });

  it("last-write-wins 按到达顺序应用旧时间戳消息", () => {
    const store = makeStore();
    receive({ senderId: "remote", timestamp: 20, state: { count: 2 } });
    receive({ senderId: "remote", timestamp: 10, state: { count: 1 } });
    expect(store.get().count).toBe(1);
  });

  it("timestamp 拒绝早于或等于最近远端消息的时间戳", () => {
    const store = makeStore({ conflictResolution: "timestamp" });
    receive({ senderId: "remote", timestamp: 20, state: { count: 2 } });
    receive({ senderId: "remote", timestamp: 10, state: { count: 1 } });
    receive({ senderId: "remote", timestamp: 20, state: { count: 3 } });
    expect(store.get().count).toBe(2);
    receive({ senderId: "remote", timestamp: 21, state: { count: 4 } });
    expect(store.get().count).toBe(4);
  });

  it("自定义冲突策略接收本地状态并应用返回值", () => {
    const store = makeStore({
      conflictResolution: (incoming, current) => ({
        count: Math.max(incoming.count ?? 0, current.count),
      }),
    });
    store.setState({ count: 10 });
    receive({ senderId: "remote", timestamp: 1, state: { count: 4 } });
    expect(store.get().count).toBe(10);
    receive({ senderId: "remote", timestamp: 2, state: { count: 20 } });
    expect(store.get().count).toBe(20);
  });

  it("忽略自身消息和不合法的外部消息", () => {
    const store = makeStore();
    store.setState({ count: 1 });
    const own = sent[0] as {
      senderId: string;
      timestamp: number;
      state: object;
    };
    receive({ ...own, state: { count: 9 } });
    for (const data of [
      null,
      "bad",
      {},
      { senderId: "x" },
      { senderId: "x", timestamp: 1, state: null },
      { senderId: "x", timestamp: NaN, state: { count: 9 } },
      { senderId: "x", timestamp: 1, state: [] },
    ])
      receive(data);
    expect(store.get().count).toBe(1);
  });

  it("缺少 BroadcastChannel 时保留本地状态能力", () => {
    rstest.stubGlobal("BroadcastChannel", undefined);
    const store = makeStore();
    store.get().increment();
    expect(store.get().count).toBe(1);
    store.destroy();
  });

  it("缺少 crypto.randomUUID 时仍生成不同发送者标识", () => {
    rstest.stubGlobal("crypto", undefined);
    const a = makeStore();
    const b = makeStore();
    a.setState({ count: 5 });
    expect(b.get().count).toBe(5);
  });

  it("销毁后关闭通道且停止接收", () => {
    const a = makeStore();
    const b = makeStore();
    a.destroy();
    a.destroy();
    b.setState({ count: 8 });
    expect(a.get().count).toBe(0);
    expect(channels.size).toBe(1);
  });

  it("远端应用抛错后仍能发送后续本地更新", () => {
    const store = makeStore();
    const unsubscribe = store.subscribe(() => {
      throw new Error("listener");
    });
    expect(() => receive({ senderId: "remote", timestamp: 1, state: { count: 1 } })).toThrow();
    unsubscribe();
    store.setState({ count: 2 });
    expect(sent).toHaveLength(1);
  });
});
