import type { InfernoNode } from "inferno";
import type { StoreApi } from "@slux/store";
import { Observer } from "./observer.js";

export type StoreValueProps<State extends object, Selection = State> = {
  store: StoreApi<State>;
  equalityFn?: (previous: Selection, next: Selection) => boolean;
  children: (value: Selection) => InfernoNode;
} & ({ selector: (state: State) => Selection } | (State extends Selection ? { selector?: undefined } : never));
export class StoreValue<State extends object, Selection = State> extends Observer<StoreValueProps<State, Selection>, Selection> {
  protected override source(props: StoreValueProps<State, Selection>) {
    return props.store;
  }
  protected override read(): Selection {
    const { store, selector } = this.props;
    return selector ? selector(store.getState()) : (store.getState() as unknown as Selection);
  }
  protected override equal(previous: Selection, next: Selection): boolean {
    return (this.props.equalityFn ?? Object.is)(previous, next);
  }
  protected override view(value: Selection): InfernoNode {
    return (this.props.children as (value: Selection) => InfernoNode)(value);
  }
  protected override subscribe(notify: () => void): () => void {
    return this.props.store.subscribe(notify);
  }
}
