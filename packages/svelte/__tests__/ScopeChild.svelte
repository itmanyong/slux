<script>
  import { getScope, toReadable } from "../src/index.js";
  export let source;
  const scope = getScope();
  const value = toReadable(source);
</script>

<span>{scope.get(source)}:{$value}</span>
