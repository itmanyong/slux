import { useFluxStore } from "../src/flux.js";
import { useMachine } from "../src/state-machine.js";
import { useObservable } from "../src/rxjs.js";
import type { sources } from "./paradigm-sources.js";

export function ParadigmReader({ source }: { source: ReturnType<typeof sources> }) {
  const flux = useFluxStore(source.flux);
  const machine = useMachine(source.machine);
  const observable = useObservable(source.observable);
  return (
    <output>
      {flux.value}:{machine.value.value}:{observable.value}
    </output>
  );
}
