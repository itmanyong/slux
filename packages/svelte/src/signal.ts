import { readable } from "svelte/store";
import type { Readable, Writable } from "svelte/store";
import { effect } from "@slux/core";
import type { Signal, Subscribable } from "@slux/core";

export function toReadable<T>(source: Subscribable<T>): Readable<T> {
  return readable(source.get(), (set) => {
    const unsubscribe = source.subscribe(set);
    const dispose = effect(() => {
      source.get();
    });
    set(source.get());
    return () => {
      unsubscribe();
      dispose();
    };
  });
}

export function toWritable<T>(source: Signal<T>): Writable<T> {
  const set = (value: T) => source.set(() => value);
  return {
    subscribe: toReadable(source).subscribe,
    set,
    update: (fn) => set(fn(source.get())),
  };
}
