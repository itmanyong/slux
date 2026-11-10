import { useSignal } from "@slux/octane";
import { useStore } from "@slux/octane/store";
import type { Subscribable } from "@slux/core";
import type { StoreApi } from "@slux/store";

export function CompiledReader({
  first,
  second,
  store,
}: {
  first: Subscribable<number>;
  second: Subscribable<number>;
  store: StoreApi<{ count: number }>;
}) {
  const a = useSignal(first);
  const b = useSignal(second);
  const whole = useStore(store);
  const selected = useStore(store, (value) => value.count);
  const compared = useStore(
    store,
    (value) => ({ count: value.count }),
    (a, b) => a.count === b.count,
  );
  return (
    <output>
      {a}:{b}:{whole.count}:{selected}:{compared.count}
    </output>
  );
}
