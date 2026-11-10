import { observable, observe, ref, snapshot, subscribe } from "../src/index.js";
import type { Ref, Snapshot } from "../src/index.js";

// 仅由 typecheck 编译，错误用例不会在运行时执行。
export function checkTypes(): void {
  const state = observable({
    nested: { n: 1 },
    items: ["a"],
    fn: (n: number) => n + 1,
    handle: ref({ n: 0 }),
  });
  state.nested.n = 2;
  state.items.push("b");
  const snap: Snapshot<typeof state> = snapshot(state);
  const count: number = snap.nested.n;
  const result: number = snap.fn(1);
  const handle: Ref<{ n: number }> = state.handle;
  const dispose: () => void = observe(() => state.nested.n);
  const unsubscribe: () => void = subscribe(state, () => {});
  // @ts-expect-error 对象属性类型保持不变。
  state.nested.n = "wrong";
  // @ts-expect-error 快照深层只读。
  snap.nested.n = 3;
  // @ts-expect-error 数组快照只读。
  snap.items.push("c");
  // @ts-expect-error 函数参数保持原类型。
  snap.fn("wrong");
  // @ts-expect-error 根必须是对象。
  observable(1);
  void [count, result, handle, dispose, unsubscribe];
}
