import { describe, it, expect, rs } from "rstack/test";
import { createStore } from "@slux/store";
import { logger } from "../src/index.js";
import type { LoggerInterface } from "../src/index.js";

type CounterState = {
  count: number;
  name: string;
  increment: () => void;
  setName: (n: string) => void;
};

function createMockLogger(): LoggerInterface & {
  log: ReturnType<typeof rs.fn>;
  group: ReturnType<typeof rs.fn>;
  groupCollapsed: ReturnType<typeof rs.fn>;
  groupEnd: ReturnType<typeof rs.fn>;
} {
  return {
    log: rs.fn(),
    group: rs.fn(),
    groupCollapsed: rs.fn(),
    groupEnd: rs.fn(),
  };
}

function setup(options?: Parameters<typeof logger>[0]) {
  const mockLogger = createMockLogger();
  const l = logger<CounterState>({
    logger: mockLogger,
    ...options,
  });
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
    { middleware: [l] },
  );
  return { l, store, mockLogger };
}

describe("logger", () => {
  it("logs state transitions with collapsed groups by default", () => {
    const { store, mockLogger } = setup();

    store.getState().increment();

    expect(mockLogger.groupCollapsed).toHaveBeenCalledOnce();
    expect(mockLogger.groupCollapsed).toHaveBeenCalledWith(expect.stringContaining("set:count"));
    expect(mockLogger.log).toHaveBeenCalledWith("prev state", expect.objectContaining({ count: 0 }));
    expect(mockLogger.log).toHaveBeenCalledWith("action    ", "set:count");
    expect(mockLogger.log).toHaveBeenCalledWith("next state", expect.objectContaining({ count: 1 }));
    expect(mockLogger.groupEnd).toHaveBeenCalledOnce();
  });

  it("uses console.group when collapsed is false", () => {
    const { store, mockLogger } = setup({ collapsed: false });

    store.getState().increment();

    expect(mockLogger.group).toHaveBeenCalledOnce();
    expect(mockLogger.groupCollapsed).not.toHaveBeenCalled();
  });

  it("includes timestamp in the format HH:MM:SS.mmm", () => {
    const { store, mockLogger } = setup();

    store.getState().increment();
    const calls = mockLogger.groupCollapsed.mock.calls[0];
    expect(calls).toBeDefined();
    const groupLabel = calls![0] as string;
    expect(groupLabel).toMatch(/▸ Slux @ \d{2}:\d{2}:\d{2}\.\d{3} set:count/);
  });

  it("includes custom name in the group label", () => {
    const { store, mockLogger } = setup({ name: "MyStore" });

    store.getState().increment();
    const calls = mockLogger.groupCollapsed.mock.calls[0];
    expect(calls).toBeDefined();
    const groupLabel = calls![0] as string;
    expect(groupLabel).toContain("MyStore");
    expect(groupLabel).not.toContain("Slux");
  });

  it("shows shallow diff when diff option is true", () => {
    const { store, mockLogger } = setup({ diff: true });

    store.getState().increment();
    expect(mockLogger.log).toHaveBeenCalledTimes(4);
    expect(mockLogger.log).toHaveBeenCalledWith(
      "diff      ",
      expect.objectContaining({
        count: { prev: 0, next: 1 },
      }),
    );
  });

  it("does not show diff when diff option is false (default)", () => {
    const { store, mockLogger } = setup();

    store.getState().increment();
    expect(mockLogger.log).toHaveBeenCalledTimes(3);
  });

  it("derives action name from multiple partial keys", () => {
    const mockLogger = createMockLogger();
    const l = logger<CounterState>({ logger: mockLogger });
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
      { middleware: [l] },
    );
    store.setState({ count: 5, name: "updated" });
    const calls = mockLogger.groupCollapsed.mock.calls[0];
    expect(calls).toBeDefined();
    const groupLabel = calls![0] as string;
    expect(groupLabel).toContain("set:count,name");
  });

  it("uses custom actionName function when provided", () => {
    const { store, mockLogger } = setup({
      actionName: () => "CUSTOM_ACTION",
    });

    store.getState().increment();
    const calls = mockLogger.groupCollapsed.mock.calls[0];
    expect(calls).toBeDefined();
    const groupLabel = calls![0] as string;
    expect(groupLabel).toContain("CUSTOM_ACTION");
    expect(mockLogger.log).toHaveBeenCalledWith("action    ", "CUSTOM_ACTION");
  });

  it("is a pass-through when enabled is false", () => {
    const { store, mockLogger } = setup({ enabled: false });

    store.getState().increment();

    expect(mockLogger.groupCollapsed).not.toHaveBeenCalled();
    expect(mockLogger.group).not.toHaveBeenCalled();
    expect(mockLogger.log).not.toHaveBeenCalled();
    expect(mockLogger.groupEnd).not.toHaveBeenCalled();
    expect(store.getState().count).toBe(1);
  });

  it("logs multiple state transitions", () => {
    const { store, mockLogger } = setup();

    store.getState().increment();
    store.getState().increment();

    expect(mockLogger.groupCollapsed).toHaveBeenCalledTimes(2);
    expect(mockLogger.groupEnd).toHaveBeenCalledTimes(2);
  });

  it('has middleware name "logger"', () => {
    const l = logger();
    expect(l.name).toBe("logger");
  });

  it("diff includes keys added in next state", () => {
    const mockLogger = createMockLogger();

    type FlexState = {
      a: number;
      b?: string;
      set: (partial: Partial<FlexState>) => void;
    };

    const l = logger<FlexState>({ logger: mockLogger, diff: true });
    const store = createStore<FlexState>(
      (set) => ({
        a: 1,
        set: (p: Partial<FlexState>) => {
          set(p);
        },
      }),
      { middleware: [l] },
    );

    store.getState().set({ b: "hello" });

    expect(mockLogger.log).toHaveBeenCalledWith(
      "diff      ",
      expect.objectContaining({
        b: { prev: undefined, next: "hello" },
      }),
    );
  });
});
