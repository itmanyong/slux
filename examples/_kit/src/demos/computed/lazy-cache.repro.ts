// 不读就不算，读过就缓存：computed · 惰性 / 缓存
import { computed, signal } from "@slux/core";

const count = signal(1);
let computes = 0;

const doubled = computed(() => {
  computes += 1;
  return count.get() * 2;
});

// 写入依赖不会主动触发计算
count.set(2);
console.log(computes); // 0

// 读取时才计算；连续读取命中缓存
console.log(doubled.get()); // 4
console.log(doubled.get()); // 4（命中缓存）
console.log(doubled.get()); // 4（命中缓存）
console.log(computes); // 1
