import { effect } from "@slux/core";

export function observe(fn: () => void): () => void {
  return effect(() => {
    fn();
  });
}
