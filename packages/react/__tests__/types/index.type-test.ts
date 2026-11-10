import { createElement } from "react";
import type { Context, ReactElement } from "react";
import { computed, createScope, signal } from "@slux/core";
import type { Scope, Subscribable } from "@slux/core";
import { ScopeContext, ScopeProvider, useScopeContext, useSignal } from "../../src/index.js";
import type { ScopeProviderProps } from "../../src/index.js";

// 只由 typecheck 编译，不在 React 组件外执行 hook。
export function checkTypes(): void {
  const count = signal(1);
  const value: number = useSignal(count);
  const derived: string = useSignal(computed(() => String(count.get())));
  const user: { name: string } = useSignal(signal({ name: "Alice" }));
  const nullable: string | null = useSignal(signal<string | null>(null));
  const source: Subscribable<boolean> = signal(true);
  const flag: boolean = useSignal(source);
  const scope: Scope | null = useScopeContext();
  const context: Context<Scope | null> = ScopeContext;
  const props: ScopeProviderProps = { scope: createScope(), children: null };
  const element: ReactElement = createElement(ScopeProvider, props);

  // @ts-expect-error hook 返回值保持来源类型。
  const invalid: string = useSignal(count);
  // @ts-expect-error 需要完整的 Subscribable，而非只有 get 的对象。
  useSignal({ get: () => 1 });
  // @ts-expect-error 必须传入有效的 scope。
  createElement(ScopeProvider, { scope: null, children: null });
  void [value, derived, user, nullable, flag, scope, context, element, invalid];
}
