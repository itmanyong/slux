import { Component } from "inferno";
import type { InfernoNode } from "inferno";
import { effect } from "@slux/core";
import type { Scope, Subscribable } from "@slux/core";
import { Observer } from "./observer.js";

export type ScopeContext = { sluxScope?: Scope };
export type ScopeProviderProps = { scope: Scope; children?: InfernoNode };
export class ScopeProvider extends Component<ScopeProviderProps> {
  override getChildContext(): ScopeContext {
    return { sluxScope: this.props.scope };
  }
  override render(): InfernoNode {
    return this.props.children;
  }
}
export function getScope(context: ScopeContext): Scope | undefined {
  return context.sluxScope;
}
export type SignalValueProps<T> = {
  source: Subscribable<T>;
  children: (value: T) => InfernoNode;
};
export class SignalValue<T, Props extends SignalValueProps<T> = SignalValueProps<T>> extends Observer<Props, T> {
  #mounted = false;
  override componentDidMount() {
    this.#mounted = true;
    super.componentDidMount();
  }
  protected override source(props: Props) {
    return props.source;
  }
  protected override read(): T {
    const scope = getScope(this.context as ScopeContext);
    return !this.#mounted && scope ? scope.get(this.props.source) : this.props.source.get();
  }
  protected override view(value: T): InfernoNode {
    return (this.props.children as (value: T) => InfernoNode)(value);
  }
  protected override subscribe(notify: () => void): () => void {
    const source = this.props.source;
    const unsubscribe = source.subscribe(notify);
    const dispose = effect(() => {
      source.get();
    });
    return () => {
      unsubscribe();
      dispose();
    };
  }
}
export { createAutoImportApis } from "./auto-import-api.js";
