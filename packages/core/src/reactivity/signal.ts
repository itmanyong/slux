import { limuUtils, produce } from "limu";
import { batch } from "./batch.js";
import { createSource, invalidate, track, untracked } from "../runtime/graph.js";
import { createNotifier } from "../runtime/notification.js";
import type { Signal, SignalOptions } from "../types/index.js";

export function signal<T>(initialValue: T, options?: SignalOptions<T>): Signal<T> {
  let state = { current: { value: initialValue } };
  const equals = options?.equals ?? Object.is;
  const source = createSource();
  const notifier = createNotifier(() => state.current.value);

  const set = (value: T | ((draft: T) => T | void)): void => {
    const nextState = untracked(() =>
      produce(
        state,
        (draft) => {
          if (typeof value === "function") {
            const result = (value as (draft: T) => T | void)(draft.current.value);
            if (result !== undefined) draft.current = { value: resolveDrafts(result) };
          } else {
            // 替换容器可绕过 limu 对 0/-0 的合并，并保留传入值的引用。
            draft.current = { value };
          }
        },
        { autoFreeze: false },
      ),
    );
    if (untracked(() => equals(state.current.value, nextState.current.value))) return;
    batch(() => {
      state = nextState;
      source.version++;
      invalidate(source);
      notifier.notify();
    });
  };

  return {
    get(): T {
      track(source);
      return state.current.value;
    },
    set,
    subscribe: notifier.subscribe,
  };
}

// 返回值可能嵌套草稿；在 limu 撤销代理前取出最终节点，保留结构共享。
function resolveDrafts<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== "object") return value;
  const meta = limuUtils.getDraftMeta(value);
  if (meta) return (meta.modified ? meta.copy : meta.self) as T;
  if (seen.has(value)) return value;
  seen.add(value);

  if (value instanceof Map) {
    let changed = false;
    const entries = Array.from(value, ([key, entry]) => {
      const nextKey = resolveDrafts(key, seen);
      const nextEntry = resolveDrafts(entry, seen);
      if (!Object.is(key, nextKey) || !Object.is(entry, nextEntry)) changed = true;
      return [nextKey, nextEntry] as const;
    });
    if (changed) {
      value.clear();
      for (const [key, entry] of entries) value.set(key, entry);
    }
  } else if (value instanceof Set) {
    const entries = Array.from(value);
    const nextEntries = entries.map((entry) => resolveDrafts(entry, seen));
    if (entries.some((entry, index) => !Object.is(entry, nextEntries[index]))) {
      value.clear();
      for (const entry of nextEntries) value.add(entry);
    }
  } else {
    const object = value as Record<PropertyKey, unknown>;
    for (const key of Reflect.ownKeys(object)) {
      const previous = object[key];
      const next = resolveDrafts(previous, seen);
      if (!Object.is(previous, next)) object[key] = next;
    }
  }
  return value;
}
