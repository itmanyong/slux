import { createSignal, onMounted } from "@viewfly/core";
export type Accessor<T> = () => T;
export function bindExternal<T>(
  get: () => T,
  subscribe: (notify: () => void) => () => void,
  equals: (a: T, b: T) => boolean = Object.is,
): Accessor<T> {
  const value = createSignal(get());
  let current = value();
  const update = () => {
    const next = get();
    if (!equals(current, next)) {
      current = next;
      value.set(next);
    }
  };
  onMounted(() => {
    let active = true;
    let dispose: (() => void) | undefined;
    // Viewfly 在挂载回调后重置更新标记；下一微任务再订阅并校验快照。
    queueMicrotask(() => {
      if (active) {
        dispose = subscribe(update);
        update();
      }
    });
    return () => {
      active = false;
      dispose?.();
    };
  });
  return () => value();
}
