import type { Signal } from "@angular/core";
import type { Atom, AnyReadableAtom } from "@slux/atom";
import { toAngularSignal } from "./bridge.js";
import type { ToAngularSignalOptions } from "./bridge.js";

export function injectAtomValue<T>(source: AnyReadableAtom<T>, options?: ToAngularSignalOptions<T>): Signal<T> {
  return toAngularSignal(source, options);
}
export function injectSetAtom<T>(source: Atom<T>): (value: T) => void {
  return (value: T) => source.set(value);
}
export function injectAtom<T>(source: Atom<T>, options?: ToAngularSignalOptions<T>): [Signal<T>, (value: T) => void] {
  return [injectAtomValue(source, options), injectSetAtom(source)];
}
