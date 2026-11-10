import { describe, it, expect, rs, afterEach } from "rstack/test";
import { createStore } from "@slux/store";
import { devtools, inspect, clearInspectors, InspectEventType } from "../src/index.js";
import type { DevtoolsConnection, DevtoolsMessage, ReduxDevtoolsExtension } from "../src/types.js";

type CounterState = {
  count: number;
  name: string;
  increment: () => void;
  setName: (n: string) => void;
};

function createMockConnection(): DevtoolsConnection & {
  init: ReturnType<typeof rs.fn>;
  send: ReturnType<typeof rs.fn>;
  subscribe: ReturnType<typeof rs.fn>;
  _listeners: ((message: DevtoolsMessage) => void)[];
  _dispatch: (message: DevtoolsMessage) => void;
} {
  const listeners: ((message: DevtoolsMessage) => void)[] = [];
  return {
    init: rs.fn(),
    send: rs.fn(),
    subscribe: rs.fn((listener: (message: DevtoolsMessage) => void) => {
      listeners.push(listener);
      return () => {
        const idx = listeners.indexOf(listener);
        if (idx >= 0) listeners.splice(idx, 1);
      };
    }),
    _listeners: listeners,
    _dispatch(message: DevtoolsMessage) {
      for (const l of listeners) l(message);
    },
  };
}

function installMockExtension() {
  const mockConn = createMockConnection();
  const ext: ReduxDevtoolsExtension = {
    connect: rs.fn(() => mockConn),
  };
  (globalThis as Record<string, unknown>)["__REDUX_DEVTOOLS_EXTENSION__"] = ext;
  return { ext, mockConn };
}

function uninstallMockExtension() {
  delete (globalThis as Record<string, unknown>)["__REDUX_DEVTOOLS_EXTENSION__"];
}

function setup(options?: Parameters<typeof devtools>[0]) {
  const { ext, mockConn } = installMockExtension();
  const dt = devtools<CounterState>(options);
  const store = createStore<CounterState>(
    (set) => ({
      count: 0,
      name: "test",
      increment: () => {
        set((s) => ({ count: s.count + 1 }));
      },
      setName: (n: string) => {
        set({ name: n });
      },
    }),
    { middleware: [dt] },
  );
  return { dt, store, ext, mockConn };
}

describe("devtools", () => {
  afterEach(() => {
    uninstallMockExtension();
    clearInspectors();
  });

  it("无扩展时仍向 inspector 发送完整生命周期", () => {
    uninstallMockExtension();
    const events: string[] = [];
    inspect((event) => events.push(event.type));
    const store = createStore(() => ({ count: 0 }), { middleware: [devtools()] });
    store.setState({ count: 2 });
    store.destroy();
    expect(events).toEqual(["init", "set", "destroy"]);
  });

  it("导入历史后回传 liftedState，且保留操作函数", () => {
    const { store, mockConn } = setup();
    const increment = store.getState().increment;
    const history = { computedStates: [{ state: { count: 20, increment: null } }] };
    mockConn._dispatch({ type: "DISPATCH", payload: { type: "IMPORT_STATE", nextLiftedState: history } });
    expect(mockConn.send).toHaveBeenCalledWith(null, history);
    expect(store.getState().increment).toBe(increment);
    store.getState().increment();
    expect(store.getState().count).toBe(21);
  });

  it("跳转、回滚和重置后操作函数仍可调用", () => {
    const { store, mockConn } = setup();
    const increment = store.getState().increment;
    for (const type of ["JUMP_TO_STATE", "JUMP_TO_ACTION", "ROLLBACK"]) {
      mockConn._dispatch({ type: "DISPATCH", payload: { type }, state: '{"count":7,"increment":null}' });
      expect(store.getState().increment).toBe(increment);
      store.getState().increment();
      expect(store.getState().count).toBe(8);
    }
    mockConn._dispatch({ type: "DISPATCH", payload: { type: "RESET" } });
    store.getState().increment();
    expect(store.getState().count).toBe(1);
  });

  it("忽略非对象状态和格式不完整的外部消息", () => {
    const { store, mockConn } = setup();
    for (const value of [null, [], 1, "text"]) {
      mockConn._dispatch({ type: "DISPATCH", payload: { type: "JUMP_TO_STATE" }, state: JSON.stringify(value) });
    }
    const malformed = [
      null,
      {},
      { type: "DISPATCH" },
      { type: "DISPATCH", payload: null },
      { type: "DISPATCH", payload: { type: "IMPORT_STATE", nextLiftedState: {} } },
    ];
    for (const message of malformed) {
      mockConn._dispatch(message as DevtoolsMessage);
    }
    expect(store.getState().count).toBe(0);
    expect(Object.keys(store.getState())).toEqual(["count", "name", "increment", "setName"]);
  });

  it("空更新使用 setState，多字段动作按名称排序", () => {
    const { store, mockConn } = setup();
    store.setState({});
    expect(mockConn.send).toHaveBeenLastCalledWith({ type: "setState" }, store.getState());
    store.setState({ name: "sorted", count: 3 });
    expect(mockConn.send).toHaveBeenLastCalledWith({ type: "set:count,name" }, store.getState());
  });

  it("销毁后已排队的扩展回调不会再操作连接或状态", () => {
    const { store, mockConn } = setup();
    const callback = mockConn._listeners[0]!;
    store.destroy();
    callback({ type: "DISPATCH", payload: { type: "RESET" } });
    expect(mockConn.init).toHaveBeenCalledTimes(1);
    expect(store.getState().count).toBe(0);
  });

  it("connects to the extension on init", () => {
    const { ext, mockConn } = setup();
    expect(ext.connect).toHaveBeenCalledWith({ name: "Slux Store" });
    expect(mockConn.init).toHaveBeenCalledWith(expect.objectContaining({ count: 0, name: "test" }));
  });

  it("uses custom name for the connection", () => {
    const { ext } = setup({ name: "MyStore" });
    expect(ext.connect).toHaveBeenCalledWith({ name: "MyStore" });
  });

  it("subscribes to extension messages", () => {
    const { mockConn } = setup();
    expect(mockConn.subscribe).toHaveBeenCalledOnce();
  });

  it("disconnects from extension on destroy", () => {
    const { store, mockConn } = setup();
    store.destroy();
    expect(mockConn._listeners).toHaveLength(0);
  });

  it("sends state updates to the extension", () => {
    const { store, mockConn } = setup();

    store.getState().increment();

    expect(mockConn.send).toHaveBeenCalledWith({ type: "set:count" }, expect.objectContaining({ count: 1 }));
  });

  it("derives action names from partial keys", () => {
    const { store, mockConn } = setup();

    store.setState({ count: 5, name: "updated" });

    expect(mockConn.send).toHaveBeenCalledWith({ type: "set:count,name" }, expect.objectContaining({ count: 5, name: "updated" }));
  });

  it("uses custom actionName function", () => {
    const { store, mockConn } = setup({
      actionName: () => "MY_ACTION",
    });

    store.getState().increment();

    expect(mockConn.send).toHaveBeenCalledWith({ type: "MY_ACTION" }, expect.objectContaining({ count: 1 }));
  });

  it("handles JUMP_TO_STATE", () => {
    const { store, mockConn } = setup();
    store.getState().increment(); // count: 1

    mockConn._dispatch({
      type: "DISPATCH",
      payload: { type: "JUMP_TO_STATE" },
      state: JSON.stringify({ count: 42, name: "jumped" }),
    } as DevtoolsMessage);

    expect(store.getState().count).toBe(42);
    expect(store.getState().name).toBe("jumped");
  });

  it("handles JUMP_TO_STATE with payload.state", () => {
    const { store, mockConn } = setup();
    store.getState().increment(); // count: 1

    mockConn._dispatch({
      type: "DISPATCH",
      payload: { type: "JUMP_TO_STATE", state: JSON.stringify({ count: 7, name: "payload" }) },
    } as DevtoolsMessage);

    expect(store.getState().count).toBe(7);
  });

  it("handles JUMP_TO_ACTION", () => {
    const { store, mockConn } = setup();
    store.getState().increment(); // count: 1

    mockConn._dispatch({
      type: "DISPATCH",
      payload: { type: "JUMP_TO_ACTION", actionId: 0 },
      state: JSON.stringify({ count: 0, name: "test" }),
    } as DevtoolsMessage);

    expect(store.getState().count).toBe(0);
  });

  it("does not re-send to extension during time travel (isTimeTraveling guard)", () => {
    const { store, mockConn } = setup();
    store.getState().increment(); // count: 1

    const sendCountBefore = mockConn.send.mock.calls.length;

    mockConn._dispatch({
      type: "DISPATCH",
      payload: { type: "JUMP_TO_STATE" },
      state: JSON.stringify({ count: 99, name: "test" }),
    } as DevtoolsMessage);
    expect(mockConn.send.mock.calls.length).toBe(sendCountBefore);
  });

  it("handles RESET by restoring initial state", () => {
    const { store, mockConn } = setup();
    store.getState().increment(); // count: 1
    store.getState().increment(); // count: 2

    mockConn._dispatch({
      type: "DISPATCH",
      payload: { type: "RESET" },
    } as DevtoolsMessage);

    expect(store.getState().count).toBe(0);
    expect(mockConn.init).toHaveBeenLastCalledWith(expect.objectContaining({ count: 0 }));
  });

  it("handles COMMIT by re-initializing with current state", () => {
    const { store, mockConn } = setup();
    store.getState().increment(); // count: 1

    mockConn._dispatch({
      type: "DISPATCH",
      payload: { type: "COMMIT" },
    } as DevtoolsMessage);

    expect(mockConn.init).toHaveBeenLastCalledWith(expect.objectContaining({ count: 1 }));
  });

  it("handles ROLLBACK by reverting to the committed state", () => {
    const { store, mockConn } = setup();
    store.getState().increment(); // count: 1

    mockConn._dispatch({
      type: "DISPATCH",
      payload: { type: "ROLLBACK" },
      state: JSON.stringify({ count: 0, name: "test" }),
    } as DevtoolsMessage);

    expect(store.getState().count).toBe(0);
    expect(mockConn.init).toHaveBeenLastCalledWith(expect.objectContaining({ count: 0 }));
  });

  it("handles IMPORT_STATE with nextLiftedState", () => {
    const { store, mockConn } = setup();

    mockConn._dispatch({
      type: "DISPATCH",
      payload: {
        type: "IMPORT_STATE",
        nextLiftedState: {
          computedStates: [{ state: { count: 10, name: "first" } }, { state: { count: 20, name: "last" } }],
        },
      },
    } as DevtoolsMessage);

    expect(store.getState().count).toBe(20);
    expect(store.getState().name).toBe("last");
  });

  it("ignores IMPORT_STATE without nextLiftedState", () => {
    const { store, mockConn } = setup();
    store.getState().increment(); // count: 1

    mockConn._dispatch({
      type: "DISPATCH",
      payload: { type: "IMPORT_STATE" },
    } as DevtoolsMessage);
    expect(store.getState().count).toBe(1);
  });

  it("ignores malformed JSON in JUMP_TO_STATE", () => {
    const { store, mockConn } = setup();
    store.getState().increment(); // count: 1

    mockConn._dispatch({
      type: "DISPATCH",
      payload: { type: "JUMP_TO_STATE" },
      state: "{invalid json}",
    } as DevtoolsMessage);
    expect(store.getState().count).toBe(1);
  });

  it("ignores JUMP_TO_STATE without state", () => {
    const { store, mockConn } = setup();
    store.getState().increment(); // count: 1

    mockConn._dispatch({
      type: "DISPATCH",
      payload: { type: "JUMP_TO_STATE" },
    } as DevtoolsMessage);
    expect(store.getState().count).toBe(1);
  });

  it("ignores ROLLBACK without state", () => {
    const { store, mockConn } = setup();
    store.getState().increment(); // count: 1

    mockConn._dispatch({
      type: "DISPATCH",
      payload: { type: "ROLLBACK" },
    } as DevtoolsMessage);
    expect(store.getState().count).toBe(1);
  });

  it("ignores malformed JSON in ROLLBACK", () => {
    const { store, mockConn } = setup();
    store.getState().increment(); // count: 1

    mockConn._dispatch({
      type: "DISPATCH",
      payload: { type: "ROLLBACK" },
      state: "not json",
    } as DevtoolsMessage);

    expect(store.getState().count).toBe(1);
  });

  it("ignores non-DISPATCH messages", () => {
    const { store, mockConn } = setup();
    store.getState().increment(); // count: 1

    mockConn._dispatch({
      type: "ACTION",
      payload: { type: "JUMP_TO_STATE" },
      state: JSON.stringify({ count: 0 }),
    } as DevtoolsMessage);
    expect(store.getState().count).toBe(1);
  });

  it("ignores unknown payload types", () => {
    const { store, mockConn } = setup();
    store.getState().increment(); // count: 1

    mockConn._dispatch({
      type: "DISPATCH",
      payload: { type: "UNKNOWN_TYPE" },
    } as DevtoolsMessage);

    expect(store.getState().count).toBe(1);
  });

  it("is SSR-safe (no-op when window is undefined)", () => {
    uninstallMockExtension();
    const dt = devtools<CounterState>();
    const store = createStore<CounterState>(
      (set) => ({
        count: 0,
        name: "test",
        increment: () => {
          set((s) => ({ count: s.count + 1 }));
        },
        setName: (n: string) => {
          set({ name: n });
        },
      }),
      { middleware: [dt] },
    );
    store.getState().increment();
    expect(store.getState().count).toBe(1);

    store.destroy();
  });

  it("does not connect when enabled is false", () => {
    const { ext, mockConn } = installMockExtension();
    const dt = devtools<CounterState>({ enabled: false });
    const store = createStore<CounterState>(
      (set) => ({
        count: 0,
        name: "test",
        increment: () => {
          set((s) => ({ count: s.count + 1 }));
        },
        setName: (n: string) => {
          set({ name: n });
        },
      }),
      { middleware: [dt] },
    );
    expect(ext.connect).not.toHaveBeenCalled();

    store.getState().increment();
    expect(mockConn.send).not.toHaveBeenCalled();
    expect(store.getState().count).toBe(1);

    store.destroy();
    uninstallMockExtension();
  });

  it('has middleware name "devtools"', () => {
    const dt = devtools();
    expect(dt.name).toBe("devtools");
  });

  it("emits init inspect event on connection", () => {
    const cb = rs.fn();
    inspect(cb);

    setup();

    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({
        type: InspectEventType.INIT,
        storeName: "Slux Store",
      }),
    );
  });

  it("emits set inspect events on state changes", () => {
    const cb = rs.fn();
    inspect(cb);

    const { store } = setup();
    cb.mockClear();

    store.getState().increment();

    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({
        type: InspectEventType.SET,
        storeName: "Slux Store",
        action: "set:count",
        state: expect.objectContaining({ count: 1 }),
        prevState: expect.objectContaining({ count: 0 }),
      }),
    );
  });

  it("emits destroy inspect event on store destroy", () => {
    const cb = rs.fn();
    inspect(cb);

    const { store } = setup();
    cb.mockClear();

    store.destroy();

    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({
        type: InspectEventType.DESTROY,
        storeName: "Slux Store",
      }),
    );
  });

  it("does not emit inspect events during time travel", () => {
    const cb = rs.fn();
    inspect(cb);

    const { store, mockConn } = setup();
    store.getState().increment(); // count: 1
    cb.mockClear();

    mockConn._dispatch({
      type: "DISPATCH",
      payload: { type: "JUMP_TO_STATE" },
      state: JSON.stringify({ count: 42, name: "jumped" }),
    } as DevtoolsMessage);
    expect(cb).not.toHaveBeenCalledWith(expect.objectContaining({ type: InspectEventType.SET }));
  });

  it("does not emit inspect events when disabled", () => {
    const cb = rs.fn();
    inspect(cb);

    installMockExtension();
    const dt = devtools<CounterState>({ enabled: false });
    const store = createStore<CounterState>(
      (set) => ({
        count: 0,
        name: "test",
        increment: () => {
          set((s) => ({ count: s.count + 1 }));
        },
        setName: (n: string) => {
          set({ name: n });
        },
      }),
      { middleware: [dt] },
    );

    expect(cb).not.toHaveBeenCalled();

    store.getState().increment();
    expect(cb).not.toHaveBeenCalled();

    store.destroy();
    uninstallMockExtension();
  });

  it("handles connection.subscribe returning an object with unsubscribe()", () => {
    const unsubFn = rs.fn();
    const mockConn = createMockConnection();
    mockConn.subscribe.mockImplementation((listener: (message: DevtoolsMessage) => void) => {
      mockConn._listeners.push(listener);
      return { unsubscribe: unsubFn };
    });

    const ext: ReduxDevtoolsExtension = {
      connect: rs.fn(() => mockConn),
    };
    (globalThis as Record<string, unknown>)["__REDUX_DEVTOOLS_EXTENSION__"] = ext;

    const dt = devtools<CounterState>();
    const store = createStore<CounterState>(
      (set) => ({
        count: 0,
        name: "test",
        increment: () => {
          set((s) => ({ count: s.count + 1 }));
        },
        setName: (n: string) => {
          set({ name: n });
        },
      }),
      { middleware: [dt] },
    );

    store.destroy();
    expect(unsubFn).toHaveBeenCalledOnce();
  });
});
