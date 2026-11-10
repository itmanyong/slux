// 互相依赖会立刻报错：computed · 循环依赖
import { computed } from "@slux/core";
import type { ReadonlySignal } from "@slux/core";

// 两个 computed 互相读取：求值过程中检测到循环并抛出错误
const a: ReadonlySignal<number> = computed(() => b.get() + 1);
const b: ReadonlySignal<number> = computed(() => a.get() + 1);

try {
  a.get();
} catch (error) {
  console.log("捕获：", (error as Error).message);
  // → 捕获： computed 存在循环依赖
}

// 错误被捕获后程序可以继续运行
console.log("继续执行");
