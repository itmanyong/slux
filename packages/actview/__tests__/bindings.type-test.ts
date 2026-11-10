import type { Ref } from "@actview/core";
import { signal } from "@slux/core";
import { atom, derived } from "@slux/atom";
import { createStore } from "@slux/store";
import { observable } from "@slux/proxy";
import { useSignal } from "../src/index.js";
import { useAtom, useAtomValue, useSetAtom } from "../src/atom.js";
import { useStore } from "../src/store.js";
import { useSnapshot } from "../src/proxy.js";

export function checkTypes() {
  const count = signal(1);
  const read = useSignal(count);
  void (read satisfies Readonly<Ref<number>>);
  const a = atom(1);
  const [value, set] = useAtom(a);
  set(2);
  useSetAtom(a)(3);
  useAtomValue(derived((get) => get(a) * 2));
  void (value.value satisfies number);
  // @ts-expect-error setter 必须接收 atom 的值类型
  set("bad");
  const selected = useStore(
    createStore(() => ({ count: 1 })),
    (s) => s.count,
  );
  void (selected.value satisfies number);
  const snapshot = useSnapshot(observable({ nested: { count: 1 } }));
  // @ts-expect-error 快照禁止嵌套写入
  snapshot.value.nested.count = 2;
  // @ts-expect-error ref 只读
  read.value = 2;
}
