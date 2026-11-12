/** @file 可写信号：基于 limu 不可变更新的状态源。 */
import { limuUtils, produce } from "limu";
import { batch } from "./batch.js";
import { createSource, invalidate, track, untracked } from "./graph.js";
import { createNotifier } from "./notification.js";
import type { Signal, SignalOptions } from "./types.js";

/**
 * 创建可写信号：set 支持直接替换值或传入 recipe 做 limu 草稿修改。
 * equals 判定未变化时不提交、不通知；写入经 batch 合并派发。
 */
export function signal<T>(initialValue: T, options?: SignalOptions<T>): Signal<T> {
  // 值包在外层容器中：写入时整体替换 current，可绕过 limu 对根级 0/-0 的合并。
  let state = { current: { value: initialValue } };
  const equals = options?.equals ?? Object.is;
  const source = createSource();
  const notifier = createNotifier(() => state.current.value);

  const set = (value: T | ((draft: T) => T | void)): void => {
    // 在无追踪上下文中计算候选状态，避免过程中的读取记入依赖。
    const nextState = untracked(() =>
      produce(
        state,
        (draft) => {
          if (typeof value === "function") {
            const result = (value as (draft: T) => T | void)(draft.current.value);
            if (result !== undefined) draft.current = { value: resolveDrafts(result) };
          } else {
            // 整体替换容器而非逐字段改写，保留传入值的引用。
            draft.current = { value };
          }
        },
        { autoFreeze: false },
      ),
    );
    if (untracked(() => equals(state.current.value, nextState.current.value))) return;
    // version 递增、失效与通知合并进同一次批处理派发。
    batch(() => {
      state = nextState;
      source.version++;
      invalidate(source);
      notifier.notify();
    });
  };

  return {
    get(): T {
      // 读取即追踪，使后续 invalidate 能通知到当前消费者。
      track(source);
      return state.current.value;
    },
    set,
    subscribe: notifier.subscribe,
  };
}

/**
 * 将可能嵌套 limu 草稿的值还原为最终节点，保留结构共享。
 * 命中草稿元信息时：已修改取 copy、未修改取 self；须在 limu 撤销代理之前调用。
 */
function resolveDrafts<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== "object") return value;
  const meta = limuUtils.getDraftMeta(value);
  if (meta) return (meta.modified ? meta.copy : meta.self) as T;
  if (seen.has(value)) return value; // 循环引用：直接返回。
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
