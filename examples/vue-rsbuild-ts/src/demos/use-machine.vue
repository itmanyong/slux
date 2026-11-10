<template>
  <div class="fd">
    <div class="fd-row">
      <span class="fd-label">state</span>
      <span class="fd-value is-strong">{{ snapshot.value }}</span>
      <span class="fd-badge">retries {{ snapshot.context.retries }}</span>
    </div>
    <div class="fd-actions">
      <button v-if="snapshot.value === 'idle'" type="button" class="fd-btn is-primary" @click="send('START', 'send START')">START</button>
      <template v-if="snapshot.value === 'loading'">
        <button type="button" class="fd-btn is-primary" @click="send('RESOLVE', 'send RESOLVE')">RESOLVE</button>
        <button type="button" class="fd-btn" @click="send('FAIL', 'send FAIL')">FAIL</button>
      </template>
      <template v-if="snapshot.value === 'error'">
        <button type="button" class="fd-btn is-primary" @click="retry">RETRY（guard 限 2 次）</button>
        <button type="button" class="fd-btn" @click="send('RESET', 'send RESET')">RESET</button>
      </template>
      <button v-if="snapshot.value === 'success'" type="button" class="fd-btn is-primary" @click="send('RESET', 'send RESET')">RESET</button>
    </div>
    <p class="fd-note">error 态的 RETRY 带 guard：超过 2 次重试后事件被拒绝，状态停在 error。</p>
  </div>
</template>

<script setup lang="ts">
import { createMachine } from "@slux/state-machine";
import { useMachine } from "@slux/vue/state-machine";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

interface FetchContext {
  retries: number;
}

type FetchEvent = { type: "START" } | { type: "RESOLVE" } | { type: "FAIL" } | { type: "RETRY" } | { type: "RESET" };

type FetchState = "idle" | "loading" | "success" | "error";

const props = defineProps<{ log: Log }>();

const machine = createMachine<FetchContext, FetchEvent, FetchState>({
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
          actions: [(context) => ({ ...context, retries: context.retries + 1 })],
        },
        RESET: {
          target: "idle",
          actions: [(context) => ({ ...context, retries: 0 })],
        },
      },
    },
  },
});
const snapshot = useMachine(machine);

const send = (event: FetchEvent["type"], message: string) => {
  machine.send({ type: event } as FetchEvent);
  props.log(message, "write");
};
const retry = () => {
  const retries = snapshot.value.context.retries;
  machine.send({ type: "RETRY" });
  props.log(retries < 2 ? `send RETRY → 第 ${retries + 1} 次重试` : "send RETRY → guard 拒绝（超过 2 次）", retries < 2 ? "write" : "error");
};
</script>
