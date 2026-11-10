import { Component } from "inferno";
import type { InfernoNode } from "inferno";

export abstract class Observer<Props, Value> extends Component<Props> {
  #unsubscribe: (() => void) | undefined;
  #value!: Value;
  protected abstract read(): Value;
  protected abstract subscribe(notify: () => void): () => void;
  protected abstract source(props: Props): unknown;
  protected abstract view(value: Value): InfernoNode;
  protected equal(previous: Value, next: Value): boolean {
    return Object.is(previous, next);
  }
  #check = () => {
    const next = this.read();
    if (!this.equal(this.#value, next)) {
      this.#value = next;
      this.forceUpdate();
    }
  };
  #connect() {
    this.#unsubscribe = this.subscribe(this.#check);
    this.#check();
  }
  override componentDidMount() {
    this.#connect();
  }
  override componentDidUpdate(previous: Props) {
    if (this.source(previous) !== this.source(this.props)) {
      this.#unsubscribe?.();
      this.#connect();
    }
  }
  override componentWillUnmount() {
    this.#unsubscribe?.();
  }
  override render(): InfernoNode {
    this.#value = this.read();
    return this.view(this.#value);
  }
}
