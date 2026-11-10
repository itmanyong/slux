<script>
import { createMachine } from "@slux/state-machine";
import { toMachine } from "@slux/svelte/state-machine";
import { get } from "svelte/store";

let { log } = $props();

const machine = createMachine({
  initial: "idle",
  context: { retries: 0 },
  states: {
    idle: {
      on: {
        START: { target: "loading" },
      },
    },
    loading: {
      on: {
        RESOLVE: { target: "success" },
        FAIL: { target: "error" },
      },
    },
    success: {
      on: {
        RESET: {
          target: "idle",
          actions: [(context) => ({ ...context, retries: 0 })],
        },
      },
    },
    error: {
      on: {
        RETRY: {
          target: "loading",
          guard: (context) => context.retries < 2,
          actions: [
            (context) => ({ ...context, retries: context.retries + 1 }),
          ],
        },
        RESET: {
          target: "idle",
          actions: [(context) => ({ ...context, retries: 0 })],
        },
      },
    },
  },
});
const snapshot = toMachine(machine);

const send = (event, message) => {
  machine.send({ type: event });
  log(message, "write");
};
const retry = () => {
  const retries = get(snapshot).context.retries;
  machine.send({ type: "RETRY" });
  log(
    retries < 2
      ? `send RETRY → 第 ${retries + 1} 次重试`
      : "send RETRY → guard 拒绝（超过 2 次）",
    retries < 2 ? "write" : "error",
  );
};
</script>

<div class="fd">
  <div class="fd-row">
    <span class="fd-label">state</span>
    <span class="fd-value is-strong">{$snapshot.value}</span>
    <span class="fd-badge">retries {$snapshot.context.retries}</span>
  </div>
  <div class="fd-actions">
    {#if $snapshot.value === "idle"}
      <button type="button" class="fd-btn is-primary" onclick={() => send("START", "send START")}>START</button>
    {/if}
    {#if $snapshot.value === "loading"}
      <button type="button" class="fd-btn is-primary" onclick={() => send("RESOLVE", "send RESOLVE")}>RESOLVE</button>
      <button type="button" class="fd-btn" onclick={() => send("FAIL", "send FAIL")}>FAIL</button>
    {/if}
    {#if $snapshot.value === "error"}
      <button type="button" class="fd-btn is-primary" onclick={retry}>RETRY（guard 限 2 次）</button>
      <button type="button" class="fd-btn" onclick={() => send("RESET", "send RESET")}>RESET</button>
    {/if}
    {#if $snapshot.value === "success"}
      <button type="button" class="fd-btn is-primary" onclick={() => send("RESET", "send RESET")}>RESET</button>
    {/if}
  </div>
  <p class="fd-note">error 态的 RETRY 带 guard：超过 2 次重试后事件被拒绝，状态停在 error。</p>
</div>
