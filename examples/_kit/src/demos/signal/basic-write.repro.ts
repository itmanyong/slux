// 一个值，所有变化的起点：signal.get / set / subscribe
import { signal } from "@slux/core";

const count = signal(0);

// 订阅：不会立即回调，只在值真正变化时触发
const unsubscribe = count.subscribe((value) => {
  console.log("count =", value);
});

// 整体替换
count.set(10); // → count = 10

// 基于当前值更新
count.set((current) => current + 1); // → count = 11

// 写入相同值：订阅不触发、通知不发生
count.set(11); // （无输出）

// 读取当前值
console.log(count.get()); // 11

// 不再需要时停止订阅
unsubscribe();
