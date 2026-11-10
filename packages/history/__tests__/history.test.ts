import { describe, it, expect } from "rstack/test";

import { computed, effect } from "@slux/core";
import { createStore } from "@slux/store";
import type { Middleware } from "@slux/store";
import { history } from "../src/index.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type CounterState = {
  count: number;
  increment: () => void;
};

function setup(options?: { maxDepth?: number }) {
  const h = history<CounterState>(options);
  const store = createStore<CounterState>(
    (set) => ({
      count: 0,
      increment: () => {
        set((s) => ({ count: s.count + 1 }));
      },
    }),
    { middleware: [h] },
  );
  return { h, store };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("history", () => {
  // --- Basic undo/redo ---

  it("undoes the last state change", () => {
    const { h, store } = setup();
    store.getState().increment(); // count: 1
    h.undo();
    expect(store.getState().count).toBe(0);
  });

  it("redoes an undone state change", () => {
    const { h, store } = setup();
    store.getState().increment(); // count: 1
    h.undo(); // count: 0
    h.redo(); // count: 1
    expect(store.getState().count).toBe(1);
  });

  it("supports multiple undo steps", () => {
    const { h, store } = setup();
    store.getState().increment(); // 1
    store.getState().increment(); // 2
    store.getState().increment(); // 3

    h.undo(); // 2
    expect(store.getState().count).toBe(2);
    h.undo(); // 1
    expect(store.getState().count).toBe(1);
    h.undo(); // 0
    expect(store.getState().count).toBe(0);
  });

  it("supports multiple redo steps", () => {
    const { h, store } = setup();
    store.getState().increment(); // 1
    store.getState().increment(); // 2
    store.getState().increment(); // 3

    h.undo(); // 2
    h.undo(); // 1
    h.undo(); // 0

    h.redo(); // 1
    expect(store.getState().count).toBe(1);
    h.redo(); // 2
    expect(store.getState().count).toBe(2);
    h.redo(); // 3
    expect(store.getState().count).toBe(3);
  });

  // --- No-op edge cases ---

  it("undo at the beginning is a no-op", () => {
    const { h, store } = setup();
    h.undo();
    expect(store.getState().count).toBe(0);
  });

  it("redo at the end is a no-op", () => {
    const { h, store } = setup();
    store.getState().increment(); // 1
    h.redo();
    expect(store.getState().count).toBe(1);
  });

  it("undo before init is a no-op", () => {
    const h = history<CounterState>();
    // Not attached to any store — api is undefined
    expect(() => {
      h.undo();
    }).not.toThrow();
  });

  it("redo before init is a no-op", () => {
    const h = history<CounterState>();
    expect(() => {
      h.redo();
    }).not.toThrow();
  });

  // --- Redo stack clearing ---

  it("clears redo stack when new state is set after undo", () => {
    const { h, store } = setup();
    store.getState().increment(); // 1
    store.getState().increment(); // 2

    h.undo(); // 1
    expect(h.canRedo.get()).toBe(true);

    store.getState().increment(); // 2 (new branch)
    expect(h.canRedo.get()).toBe(false);
    h.redo();
    expect(store.getState().count).toBe(2); // redo is no-op
  });

  // --- maxDepth ---

  it("limits undo stack to maxDepth", () => {
    const { h, store } = setup({ maxDepth: 3 });

    store.getState().increment(); // 1
    store.getState().increment(); // 2
    store.getState().increment(); // 3
    store.getState().increment(); // 4
    store.getState().increment(); // 5

    // Only 3 undo steps are available
    h.undo(); // 4
    h.undo(); // 3
    h.undo(); // 2
    expect(store.getState().count).toBe(2);

    // Further undo is a no-op (oldest snapshots were discarded)
    h.undo();
    expect(store.getState().count).toBe(2);
  });

  it("uses default maxDepth of 100", () => {
    const { h, store } = setup();

    for (let i = 0; i < 105; i++) {
      store.getState().increment();
    }
    // count is 105

    // Undo 100 times (the max)
    for (let i = 0; i < 100; i++) {
      h.undo();
    }
    expect(store.getState().count).toBe(5);

    // Further undo is a no-op
    h.undo();
    expect(store.getState().count).toBe(5);
  });

  // --- Reactive signals ---

  it("canUndo reflects undo availability", () => {
    const { h, store } = setup();

    expect(h.canUndo.get()).toBe(false);
    store.getState().increment();
    expect(h.canUndo.get()).toBe(true);
    h.undo();
    expect(h.canUndo.get()).toBe(false);
  });

  it("canRedo reflects redo availability", () => {
    const { h, store } = setup();

    expect(h.canRedo.get()).toBe(false);
    store.getState().increment();
    expect(h.canRedo.get()).toBe(false);
    h.undo();
    expect(h.canRedo.get()).toBe(true);
    h.redo();
    expect(h.canRedo.get()).toBe(false);
  });

  it("canUndo/canRedo work with computed()", () => {
    const { h, store } = setup();

    const status = computed(() => `undo:${String(h.canUndo.get())},redo:${String(h.canRedo.get())}`);

    expect(status.get()).toBe("undo:false,redo:false");
    store.getState().increment();
    expect(status.get()).toBe("undo:true,redo:false");
    h.undo();
    expect(status.get()).toBe("undo:false,redo:true");
  });

  it("canUndo/canRedo work with effect()", () => {
    const { h, store } = setup();
    const values: boolean[] = [];

    effect(() => {
      values.push(h.canUndo.get());
      return undefined;
    });

    store.getState().increment(); // canUndo -> true
    h.undo(); // canUndo -> false

    expect(values).toEqual([false, true, false]);
  });

  // --- clear() ---

  it("clears all history", () => {
    const { h, store } = setup();

    store.getState().increment(); // 1
    store.getState().increment(); // 2
    h.undo(); // 1

    expect(h.canUndo.get()).toBe(true);
    expect(h.canRedo.get()).toBe(true);

    h.clear();

    expect(h.canUndo.get()).toBe(false);
    expect(h.canRedo.get()).toBe(false);
    expect(store.getState().count).toBe(1); // state unchanged
  });

  it("clear before init does not throw", () => {
    const h = history<CounterState>();
    expect(() => {
      h.clear();
    }).not.toThrow();
  });

  // --- Middleware interop ---

  it("other middleware sees undo/redo state changes", () => {
    const log: { prev: number; next: number }[] = [];

    const logger: Middleware<CounterState> = {
      name: "logger",
      onSet: (api, next, partial) => {
        const prev = api.getState().count;
        next(partial);
        const nextCount = api.getState().count;
        log.push({ prev, next: nextCount });
      },
    };

    const h = history<CounterState>();
    const store = createStore<CounterState>(
      (set) => ({
        count: 0,
        increment: () => {
          set((s) => ({ count: s.count + 1 }));
        },
      }),
      { middleware: [h, logger] },
    );

    store.getState().increment(); // 0 -> 1
    h.undo(); // 1 -> 0

    expect(log).toEqual([
      { prev: 0, next: 1 },
      { prev: 1, next: 0 },
    ]);
  });

  it("does not re-record during undo/redo (isTimeTraveling guard)", () => {
    const { h, store } = setup();

    store.getState().increment(); // 1
    store.getState().increment(); // 2

    h.undo(); // -> 1

    // If undo were re-recorded, we'd have an extra entry.
    // canUndo should reflect only the original history.
    expect(h.canUndo.get()).toBe(true); // original 0 -> 1 entry remains
    h.undo(); // -> 0
    expect(h.canUndo.get()).toBe(false); // nothing left
    expect(store.getState().count).toBe(0);
  });

  // --- Destroy ---

  it("clears history on store destroy", () => {
    const { h, store } = setup();

    store.getState().increment();
    expect(h.canUndo.get()).toBe(true);

    store.destroy();

    expect(h.canUndo.get()).toBe(false);
    expect(h.canRedo.get()).toBe(false);
  });

  it("undo/redo after destroy is a no-op", () => {
    const { h, store } = setup();

    store.getState().increment();
    store.destroy();

    expect(() => {
      h.undo();
    }).not.toThrow();
    expect(() => {
      h.redo();
    }).not.toThrow();
  });

  // --- Factory defaults ---

  it("works without options", () => {
    const h = history<CounterState>();
    const store = createStore<CounterState>(
      (set) => ({
        count: 0,
        increment: () => {
          set((s) => ({ count: s.count + 1 }));
        },
      }),
      { middleware: [h] },
    );

    store.getState().increment();
    h.undo();
    expect(store.getState().count).toBe(0);
  });

  it('has name "history"', () => {
    const h = history();
    expect(h.name).toBe("history");
  });
});
