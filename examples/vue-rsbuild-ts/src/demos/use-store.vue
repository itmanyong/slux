<template>
  <div class="fd">
    <div class="fd-row">
      <span class="fd-label">items（已订阅）</span>
      <span class="fd-value is-strong">{{ items }}</span>
      <span class="fd-label">total（未订阅）</span>
      <span class="fd-badge">{{ totalBadge }}</span>
    </div>
    <div class="fd-actions">
      <button type="button" class="fd-btn is-primary" @click="addItem">items + 1</button>
      <button type="button" class="fd-btn" @click="addTotal">只改 total</button>
      <button type="button" class="fd-btn" @click="clear">清空</button>
    </div>
    <p class="fd-note">badge 里的 total 是读取时的快照，点「运行日志」查看重渲染证据。</p>
  </div>
</template>

<script setup lang="ts">
import { createStore } from "@slux/store";
import { useStore } from "@slux/vue/store";
import { watchEffect } from "vue";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

interface CartState {
  items: number;
  total: number;
}

const props = defineProps<{ log: Log }>();

const store = createStore<CartState>(() => ({ items: 0, total: 0 }));
const items = useStore(store, (state) => state.items);

const totalBadge = store.getState().total.toFixed(1);

watchEffect(() => {
  props.log(`组件重渲染：items = ${items.value}`, "notify");
});

const addItem = () => {
  store.setState((state) => ({ items: state.items + 1 }));
  props.log("setState → items + 1", "write");
};
const addTotal = () => {
  store.setState((state) => ({ total: state.total + 9.9 }));
  props.log("setState → total + 9.9（组件应不重渲染）", "write");
};
const clear = () => {
  store.setState({ items: 0, total: 0 });
  props.log("setState → 清空", "write");
};
</script>
