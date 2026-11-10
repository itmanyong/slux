import { atom, derived, writableAtom } from "@slux/atom";
import { observable } from "@slux/proxy";
import type { Snapshot } from "@slux/proxy";
import { createStore } from "@slux/store";
import { useAtom, useAtomValue, useSetAtom } from "../../src/atom.js";
import { useSnapshot } from "../../src/proxy.js";
import { useStore } from "../../src/store.js";

// 只由 typecheck 编译，不在 React 组件外执行 hook。
export function checkParadigmTypes(): void {
  const count = atom(1);
  const tuple: [number, (value: number) => void] = useAtom(count);
  const set: (value: number) => void = useSetAtom(count);
  const text: string = useAtomValue(derived((get) => String(get(count))));
  const writable = writableAtom(
    (get) => get(count),
    (_get, write, value: number) => write(count, value),
  );
  const readable: number = useAtomValue(writable);
  const nullable: string | null = useAtomValue(atom<string | null>(null));
  const callback = atom((value: number) => String(value));
  useSetAtom(callback)((value) => String(value + 1));

  interface State {
    count: number;
    label: string;
  }
  const store = createStore<State>(() => ({ count: 1, label: "ready" }));
  const state: State = useStore(store);
  const selection: number = useStore(store, (value) => value.count);
  const object: { label: string } = useStore(
    store,
    (value) => ({ label: value.label }),
    (a, b) => a.label === b.label,
  );

  const proxy = observable({
    count: 1,
    nested: { name: "Alice" },
    items: [1, 2],
  });
  const snap: Snapshot<typeof proxy> = useSnapshot(proxy);

  // @ts-expect-error 基础 atom setter 的值类型必须匹配。
  set("wrong");
  // @ts-expect-error 只读 atom 没有 setter。
  useSetAtom(derived((get) => get(count)));
  // @ts-expect-error writableAtom 使用自己的 write 接口，不具备基础 atom 的 set。
  useAtom(writable);
  // @ts-expect-error selector 保留 State 的字段约束。
  useStore(store, (value) => value.missing);
  const badEquals = (a: string, b: string) => a === b;
  // @ts-expect-error 比较器参数必须与选值类型一致。
  useStore(store, (value) => value.count, badEquals);
  // @ts-expect-error 快照属性只读。
  snap.count = 2;
  // @ts-expect-error 嵌套快照属性只读。
  snap.nested.name = "Bob";
  // @ts-expect-error 快照数组不可修改。
  snap.items.push(3);
  void [tuple, text, readable, nullable, state, selection, object];
}
