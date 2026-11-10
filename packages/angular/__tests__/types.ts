import type { Signal } from "@angular/core";
import type { Atom, ReadonlyAtom } from "@slux/atom";
import type { StoreApi } from "@slux/store";
import { injectAtom, injectAtomValue, injectSetAtom } from "../src/atom.js";
import { injectStore } from "../src/store.js";
import { injectSnapshot } from "../src/proxy.js";

export function checkTypes(
  atom: Atom<number>,
  readonlyAtom: ReadonlyAtom<number>,
  store: StoreApi<{ count: number }>,
  proxy: { nested: { count: number } },
) {
  const value: Signal<number> = injectAtomValue(readonlyAtom);
  const pair: [Signal<number>, (value: number) => void] = injectAtom(atom);
  const whole: Signal<{ count: number }> = injectStore(store);
  const selection: Signal<number> = injectStore(store, (state) => state.count);
  const snapshot = injectSnapshot(proxy);
  // @ts-expect-error 只读 atom 没有写入接口。
  injectSetAtom(readonlyAtom);
  // @ts-expect-error setter 不接受不同类型。
  pair[1]("1");
  // @ts-expect-error Angular 桥接输出只读 Signal。
  value.set(2);
  // @ts-expect-error proxy 快照嵌套值只读。
  snapshot().nested.count = 2;
  return { whole, selection };
}
