// 清理函数贴着上一轮运行：effect(fn) => cleanup
import { effect, signal } from "@slux/core";

const count = signal(0);
let runs = 0;
let cleanups = 0;

// 回调返回的函数会在下一次重跑前执行，释放时再执行一次
const stop = effect(() => {
  const value = count.get();
  runs += 1;
  console.log("运行 #", runs, "：", value);
  return () => {
    cleanups += 1;
    console.log("清理 #", cleanups, "：释放", value);
  };
}); // → 运行 # 1 ： 0
console.log(runs, cleanups); // 1 0

count.set(1);
// → 清理 # 1 ：释放 0
// → 运行 # 2 ： 1
console.log(runs, cleanups); // 2 1

stop(); // → 清理 # 2 ：释放 1

// 释放后写入不再触发重跑
count.set(2);
console.log(runs, cleanups); // 2 2
