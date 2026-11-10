import type { InfernoNode } from "inferno";
import { snapshot, subscribe } from "@slux/proxy";
import type { Snapshot } from "@slux/proxy";
import { Observer } from "./observer.js";

export type ProxyValueProps<T extends object> = {
  proxy: T;
  children: (value: Snapshot<T>) => InfernoNode;
};
export class ProxyValue<T extends object> extends Observer<ProxyValueProps<T>, Snapshot<T>> {
  protected override source(props: ProxyValueProps<T>) {
    return props.proxy;
  }
  protected override read(): Snapshot<T> {
    return snapshot(this.props.proxy);
  }
  protected override view(value: Snapshot<T>): InfernoNode {
    return this.props.children(value);
  }
  protected override subscribe(notify: () => void): () => void {
    return subscribe(this.props.proxy, notify);
  }
}
