<template>
  <div class="fd">
    <div class="fd-row">
      <span class="fd-label">left × right</span>
      <span class="fd-value">{{ leftValue }} × {{ rightValue }}</span>
      <span class="fd-value is-strong">= {{ totalValue }}</span>
    </div>
    <div class="fd-actions">
      <button type="button" class="fd-btn" @click="bump(left, 'left')">left + 1</button>
      <button type="button" class="fd-btn is-primary" @click="bump(right, 'right')">right + 1</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, signal } from "@slux/core";
import type { Signal } from "@slux/core";
import { useSignal } from "@slux/vue";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;
const props = defineProps<{ log: Log }>();

const left = signal(2);
const right = signal(3);
const total = computed(() => left.get() * right.get());

const leftValue = useSignal(left);
const rightValue = useSignal(right);
const totalValue = useSignal(total);

const bump = (source: Signal<number>, name: string) => {
  source.set(source.get() + 1);
  props.log(`${name} → ${source.get()}`, "write");
};
</script>
