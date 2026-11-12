import { describe, expect, it, rs } from "rstack/test";
import { createStore } from "@slux/store";
import { devtools, inspect, InspectEventType, type InspectEvent } from "@slux/devtools";
import { memoryStorage, persist } from "@slux/storage";
import { broadcast } from "@slux/tab-sync";
import { telemetry, type StateChangeMetadata } from "@slux/telemetry";
import { history } from "../src/index.js";

describe("五个中间件组合", () => {
  it("同步恢复可经过尚未 init 的 history，撤销会同步保存和上报", () => {
    type State = { count: number };
    const storage = memoryStorage();
    storage.setItem("counter", JSON.stringify({ state: { count: 5 }, version: 0 }));
    const h = history<State>();
    const p = persist<State>({ key: "counter", storage });
    const changes: StateChangeMetadata<State>[] = [];
    const store = createStore(() => ({ count: 0 }), {
      middleware: [p, h, telemetry({ onStateChange: (change) => changes.push(change) })],
    });
    expect(store.getState().count).toBe(5);
    expect(p.hasHydrated()).toBe(true);
    h.undo();
    expect(store.getState().count).toBe(0);
    expect(JSON.parse(storage.getItem("counter") as string).state).toEqual({
      count: 0,
    });
    expect(changes.map((change) => change.nextState.count)).toEqual([5, 0]);
    store.destroy();
  });

  it("真实 BroadcastChannel 传递更新和撤销，接收方持久化且不回传", async () => {
    type State = { count: number; increment: () => void };
    const channel = `slux-integration-${crypto.randomUUID()}`;
    const events: InspectEvent[] = [];
    const stopInspect = inspect((event) => events.push(event));
    const changes: StateChangeMetadata<State>[] = [];
    const storage = memoryStorage();
    const h = history<State>();
    const first = createStore<State>(
      (set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }),
      {
        middleware: [
          h,
          persist({ key: "first", storage }),
          broadcast({ channel, filter: (state) => ({ count: state.count }) }),
          telemetry({ onStateChange: (change) => changes.push(change) }),
          devtools({ name: "first" }),
        ],
      },
    );
    const second = createStore<State>(
      (set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }),
      {
        middleware: [
          persist({ key: "second", storage }),
          broadcast({ channel, filter: (state) => ({ count: state.count }) }),
          telemetry({ onStateChange: (change) => changes.push(change) }),
          devtools({ name: "second" }),
        ],
      },
    );
    try {
      first.getState().increment();
      await rs.waitFor(() => expect(second.getState().count).toBe(1));
      expect(JSON.parse(storage.getItem("second") as string).state).toEqual({
        count: 1,
      });
      h.undo();
      await rs.waitFor(() => expect(second.getState().count).toBe(0));
      h.redo();
      await rs.waitFor(() => expect(second.getState().count).toBe(1));
      expect(changes.map((change) => change.nextState.count)).toEqual([1, 1, 0, 0, 1, 1]);
      expect(events.filter((event) => event.type === InspectEventType.SET)).toHaveLength(6);
      expect(typeof first.getState().increment).toBe("function");
      expect(typeof second.getState().increment).toBe("function");
    } finally {
      first.destroy();
      second.destroy();
      stopInspect();
    }
    expect(events.filter((event) => event.type === InspectEventType.DESTROY)).toHaveLength(2);
  });
});
