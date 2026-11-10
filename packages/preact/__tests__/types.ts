import type { Atom, ReadonlyAtom } from "@slux/atom";
import type { StoreApi } from "@slux/store";
import { useAtom, useAtomValue, useSetAtom } from "../src/atom.js";
import { useStore } from "../src/store.js";
import { useSnapshot } from "../src/proxy.js";

export function checkTypes(
  atom: Atom<number>,
  readonlyAtom: ReadonlyAtom<number>,
  store: StoreApi<{ count: number }>,
  proxy: { nested: { count: number } },
) {
  const value: number = useAtomValue(readonlyAtom);
  const pair: [number, (value: number) => void] = useAtom(atom);
  const whole: { count: number } = useStore(store);
  const selection: number = useStore(store, (state) => state.count);
  const snapshot = useSnapshot(proxy);
  // @ts-expect-error 只读 atom 没有写入接口。
  useSetAtom(readonlyAtom);
  // @ts-expect-error setter 不接受不同类型。
  pair[1]("1");
  // @ts-expect-error proxy 快照嵌套值只读。
  snapshot.nested.count = 2;
  return { value, whole, selection };
}
