import type { InfernoNode } from "inferno";
import type { Atom, AnyReadableAtom } from "@slux/atom";
import { effect } from "@slux/core";
import { Observer } from "./observer.js";

export type AtomValueProps<T> = {
  atom: AnyReadableAtom<T>;
  children: (value: T) => InfernoNode;
};
export class AtomValue<T> extends Observer<AtomValueProps<T>, T> {
  protected override source(props: AtomValueProps<T>) {
    return props.atom;
  }
  protected override read(): T {
    return this.props.atom.get();
  }
  protected override view(value: T): InfernoNode {
    return this.props.children(value);
  }
  protected override subscribe(notify: () => void): () => void {
    const atom = this.props.atom;
    const unsubscribe = atom.subscribe(notify);
    const dispose = effect(() => {
      atom.get();
    });
    return () => {
      unsubscribe();
      dispose();
    };
  }
}
export function setAtom<T>(atom: Atom<T>, value: T): void {
  atom.set(value);
}
