// 嵌套的批处理只有一个结束点：batch · 嵌套 / 返回值
import { batch, effect, signal } from "@slux/core";

const count = signal(0);
let runs = 0;
const stop = effect(() => {
  runs += 1;
});

// 嵌套批处理：只有最外层结束时才刷新，返回值原样带出
const doubled = batch(() => {
  batch(() => {
    count.set(1); // 内层结束时不刷新
  });
  count.set(count.get() + 10);
  return count.get() * 2;
});

console.log(count.get()); // 11
console.log(runs); // 1（整个嵌套过程只刷新一次）
console.log(doubled); // 22

stop();
