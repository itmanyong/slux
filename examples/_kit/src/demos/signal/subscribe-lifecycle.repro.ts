// 订阅只在变化时回调：signal.subscribe
import { signal } from "@slux/core";

const count = signal(0);

// 订阅建立时不会立即回调
const unsubscribe = count.subscribe((value) => {
  console.log("回调收到", value);
});

count.set(1); // → 回调收到 1
count.set(1); // 相同值不回调
count.set(2); // → 回调收到 2

// 取消函数可以重复调用；退订后写入不再回调
unsubscribe();
unsubscribe();
count.set(3); // （无输出）
