import type { ReadonlyAtom } from "@slux/atom";
import type { StoreApi } from "@slux/store";
import { setAtom } from "../src/atom.js";
import type { AtomValueProps } from "../src/atom.js";
import type { StoreValueProps } from "../src/store.js";
import type { ProxyValueProps } from "../src/proxy.js";

export function checkTypes(atom: ReadonlyAtom<number>, store: StoreApi<{ count: number }>) {
  const readonlyProps: AtomValueProps<number> = {
    atom,
    children: (value) => String(value),
  };
  const selected: StoreValueProps<{ count: number }, number> = {
    store,
    selector: (state) => state.count,
    children: (value) => String(value),
  };
  const full: StoreValueProps<{ count: number }> = {
    store,
    children: (value) => String(value.count),
  };
  // @ts-expect-error 选值类型不同于状态时必须提供 selector。
  const invalid: StoreValueProps<{ count: number }, number> = {
    store,
    children: (value) => String(value),
  };
  // @ts-expect-error 只读 atom 不能传给写入接口。
  setAtom(atom, 2);
  const proxyProps: ProxyValueProps<{ nested: { count: number } }> = {
    proxy: { nested: { count: 1 } },
    children: (value) => {
      // @ts-expect-error proxy 快照嵌套值只读。
      value.nested.count = 2;
      return String(value.nested.count);
    },
  };
  return { readonlyProps, selected, full, invalid, proxyProps };
}
