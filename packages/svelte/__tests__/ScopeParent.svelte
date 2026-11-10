<script>
  import { setScope } from "../src/index.js";
  import ScopeChild from "./ScopeChild.svelte";
  export let scope;
  export let source;
  setScope(scope);
</script>

<ScopeChild {source} />
