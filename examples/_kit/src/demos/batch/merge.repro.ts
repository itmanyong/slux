// 多次写入，一次通知：batch(fn)
import { batch, effect, signal } from "@slux/core";

const count = signal(0);
let notifications = 0;
let runs = 0;

const unsubscribe = count.subscribe(() => {
  notifications += 1;
});
const stop = effect(() => {
  count.get(); // effect 必须读取依赖才会重跑
  runs += 1;
});

// 批外三次写入：通知与 effect 各执行 3 次
count.set(1);
count.set(2);
count.set(3);
console.log(notifications, runs); // 3 4（初始 1 次 + 3 次重跑）

// 批内三次写入：批内读取立即可见，结束时只刷新一次
batch(() => {
  count.set(4);
  count.set(5);
  console.log(count.get()); // 5
});
console.log(notifications, runs); // 4 5（通知与重跑各只追加一次）

unsubscribe();
stop();
