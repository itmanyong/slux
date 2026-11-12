import { batch, computed, createScope, effect, runInScope, signal } from "../src/index.js";
import type { ReadonlySignal, Signal, Subscribable } from "../src/types.js";

// 仅由 typecheck 编译，错误用例不会在运行时执行。
export function checkTypes(): void {
  const count: Signal<number> = signal(0);
  const user = signal({ name: "Alice", age: 30 });
  const name: string = user.get().name;
  const doubled: ReadonlySignal<number> = computed(() => count.get() * 2);
  const source: Subscribable<number> = doubled;
  const nullable = signal<string | null>(null);
  nullable.set("ready");
  nullable.set(null);
  count.set((current) => current + 1);
  user.set((draft) => {
    draft.age++;
    draft.name = "Bob";
  });
  const callback = signal((value: number) => value + 1);
  callback.set(() => (value: number) => value * 2);
  const unsubscribe: () => void = source.subscribe((value) => {
    count.set(value);
  });
  const dispose: () => void = effect(() => {
    count.get();
  });
  const scope = createScope();
  scope.set(count, 2);
  const value: number = scope.get(count);
  const batched: number = batch(() => 42);
  const scoped: string = runInScope(scope, () => "done");

  // @ts-expect-error 只读派生值不允许写入。
  doubled.set(1);
  // @ts-expect-error 写入值必须与信号类型一致。
  count.set("wrong");
  // @ts-expect-error 更新回调必须返回匹配的类型。
  count.set(() => "wrong");
  // @ts-expect-error 写入统一使用 set，不再提供 update。
  count.update((current: number) => current + 1);
  user.set((draft) => {
    // @ts-expect-error draft 属性仍保持原来的类型。
    draft.age = "wrong";
  });
  // @ts-expect-error 作用域只能写入可写信号。
  scope.set(doubled, 1);
  // @ts-expect-error 作用域写入类型必须一致。
  scope.set(count, "wrong");

  void [name, value, batched, scoped, unsubscribe, dispose];
}
