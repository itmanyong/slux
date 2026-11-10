// 批处理不是事务：batch · 异常语义
import { batch, effect, signal } from "@slux/core";

const count = signal(0);
let runs = 0;
const stop = effect(() => {
  runs += 1;
});

// 回调抛错：已提交的写入照常刷新，错误继续向外抛出
try {
  batch(() => {
    count.set(1);
    count.set(11);
    throw new Error("回调中途失败");
  });
} catch (error) {
  console.log((error as Error).message); // 回调中途失败
}

console.log(count.get()); // 11（写入没有回滚）
console.log(runs); // 1（刷新仍然发生）

stop();
