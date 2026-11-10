import type { Readable, Writable } from "svelte/store";
import { signal, computed } from "@slux/core";
import { createStore } from "@slux/store";
import { atom, derived } from "@slux/atom";
import { observable } from "@slux/proxy";
import { toReadable, toWritable } from "../src/index.js";
import { toStore } from "../src/store.js";
import { toAtom, toAtomValue } from "../src/atom.js";
import { toSnapshot } from "../src/proxy.js";

export function checkTypes(): void {
  const value: Readable<number> = toReadable(signal(1));
  const writable: Writable<() => number> = toWritable(signal(() => 1));
  const store = createStore(() => ({ count: 1 }));
  const selected: Readable<string> = toStore(store, (state) => String(state.count));
  const whole: Readable<{ count: number }> = toStore(store);
  const count = atom(1);
  const writableAtom: Writable<number> = toAtom(count);
  const readonly = derived((get) => get(count) * 2);
  const derivedValue: Readable<number> = toAtomValue(readonly);
  const snapshot = toSnapshot(observable({ nested: { count: 1 } }));
  // @ts-expect-error 派生 atom 不可写入。
  toAtom(readonly);
  // @ts-expect-error computed 不可写入。
  toWritable(computed(() => 1));
  // @ts-expect-error atom setter 保留值类型。
  writableAtom.set("2");
  snapshot.subscribe((state) => {
    // @ts-expect-error 快照深层只读。
    state.nested.count = 2;
  });
  void [value, writable, selected, whole, writableAtom, derivedValue, snapshot];
}
