import { useFluxStore } from "@slux/octane/flux";
import { useMachine } from "@slux/octane/state-machine";
import { useObservable } from "@slux/octane/rxjs";
import type { Sources } from "./new-paradigms.fixture.js";

export function CompiledParadigmsReader({ sources }: { sources: Sources }) {
  const state = useFluxStore(sources.flux);
  const snapshot = useMachine(sources.machine);
  const value = useObservable(sources.observable);
  return <output>{`${state}:${snapshot.value}:${snapshot.context.count}:${value}`}</output>;
}
