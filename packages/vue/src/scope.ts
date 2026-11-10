import { defineComponent, inject, provide } from "vue";
import type { InjectionKey, Plugin, PropType } from "vue";
import type { Scope } from "@slux/core";

const SCOPE_KEY: InjectionKey<Scope> = Symbol("slux-scope");
export type SluxPluginOptions = { readonly scope?: Scope };

export function provideScope(scope: Scope): void {
  provide(SCOPE_KEY, scope);
}
export function useScope(): Scope | undefined {
  return inject(SCOPE_KEY, undefined);
}
export const ScopeProvider = defineComponent({
  name: "SluxScopeProvider",
  props: { scope: { type: Object as PropType<Scope>, required: true } },
  setup(props, { slots }) {
    provideScope(props.scope);
    return () => slots["default"]?.();
  },
});
export const sluxPlugin: Plugin<[SluxPluginOptions] | []> = {
  install(app, options) {
    if (options?.scope) app.provide(SCOPE_KEY, options.scope);
  },
};
