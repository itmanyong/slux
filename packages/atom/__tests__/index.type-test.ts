import type { Subscribable } from "@slux/core";
import { atom, atomFactory, createAtomScope, derived, writableAtom } from "../src/index.js";
import type { AnyReadableAtom, Atom, AtomGetter, AtomScope, AtomSetter, ReadonlyAtom, WritableAtom } from "../src/index.js";

// 仅由 typecheck 编译，错误用例不会在运行时执行。
export function checkTypes(): void {
  const count: Atom<number> = atom(0);
  const readonly: ReadonlyAtom<string> = derived((get) => String(get(count)));
  const readable: Subscribable<string> = readonly;
  const any: AnyReadableAtom<string> = readonly;
  const scope: AtomScope = createAtomScope();
  const value: number = scope.get(count);
  const nullable = atom<string | null>(null);
  nullable.set("ready");
  nullable.set(null);
  const writable: WritableAtom<number, [number, string], boolean> = writableAtom(
    (get) => get(count),
    (_get, set, next: number, name: string) => {
      set(count, next);
      return name.length > 0;
    },
  );
  const result: boolean = writable.write(2, "ready");
  const action = writableAtom(null, (_get, set) => set(count, 1));
  const nullValue: null = action.get();
  const family = atomFactory((key: string) => atom({ key }));
  const instance: Atom<{ key: string }> = family("a");
  const removed: boolean = family.remove("a");
  const getter: AtomGetter = (source) => source.get();
  const setter: AtomSetter = (target, next) => target.set(next);
  const asyncValue: ReadonlyAtom<Promise<number>> = derived(async (get) => get(count));

  // @ts-expect-error 只读 atom 不提供 set。
  readonly.set("wrong");
  // @ts-expect-error 写入类型必须匹配基础 atom。
  count.set("wrong");
  // @ts-expect-error 更新函数必须返回相同值类型。
  count.update(() => "wrong");
  // @ts-expect-error 作用域不能写入只读 atom。
  scope.set(readonly, "wrong");
  // @ts-expect-error setter 只允许基础 atom。
  setter(writable, 2);
  // @ts-expect-error writable 参数数量与类型需要匹配。
  writable.write("wrong");
  // @ts-expect-error family 参数类型不能改变。
  family(1);
  void [readable, any, value, result, nullValue, instance, removed, getter, asyncValue];
}
