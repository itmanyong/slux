import type { Accessor } from "solid-js";
import { signal } from "@slux/core";
import { createStore } from "@slux/store";
import { atom, derived } from "@slux/atom";
import { observable } from "@slux/proxy";
import { useSignal } from "../src/index.js";
import { useStore } from "../src/store.js";
import { useAtom, useAtomValue, useSetAtom } from "../src/atom.js";
import { useSnapshot } from "../src/proxy.js";

export function checkTypes(): void {
  const value: Accessor<number> = useSignal(signal(1));
  const store = createStore(() => ({ count: 1 }));
  const selected: Accessor<string> = useStore(store, (state) => String(state.count));
  const whole: Accessor<{ count: number }> = useStore(store);
  const count = atom(1);
  const pair: [Accessor<number>, (next: number) => void] = useAtom(count);
  const readonly = derived((get) => get(count) * 2);
  const derivedValue: Accessor<number> = useAtomValue(readonly);
  const snapshot = useSnapshot(observable({ nested: { count: 1 } }));
  // @ts-expect-error 派生 atom 不可写入。
  useSetAtom(readonly);
  // @ts-expect-error atom setter 保留值类型。
  pair[1]("2");
  // @ts-expect-error 快照深层只读。
  snapshot().nested.count = 2;
  // @ts-expect-error accessor 不接受 setter 参数。
  value(2);
  void [value, selected, whole, pair, derivedValue, snapshot];
}
