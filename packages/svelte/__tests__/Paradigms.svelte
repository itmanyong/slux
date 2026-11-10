<script lang="ts">
  import type { createSources } from "./paradigm-fixtures.js";
  import { toFluxStore } from "../src/flux.js";
  import { toMachine } from "../src/state-machine.js";
  import { toObservableStore } from "../src/rxjs.js";

  let { source }: { source: ReturnType<typeof createSources> } = $props();
  const flux = toFluxStore(source.flux);
  const machine = toMachine(source.machine);
  const observable = toObservableStore(source.observable);
</script>

<span>{$flux}:{$machine.context}:{$observable}</span>
