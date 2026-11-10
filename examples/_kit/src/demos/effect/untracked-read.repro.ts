// 清理函数里的读取不算依赖：effect · 清理函数中的读取
import { effect, signal } from "@slux/core";

const primary = signal("A");
const noise = signal(0);
let runs = 0;

// 清理函数在无依赖追踪的环境里执行：读取 noise 不构成依赖
const stop = effect(() => {
  const value = primary.get();
  runs += 1;
  console.log("运行 #", runs, "：primary =", value);
  return () => {
    console.log("清理时 noise =", noise.get());
  };
}); // → 运行 # 1 ：primary = A

primary.set("B");
// → 清理时 noise = 0
// → 运行 # 2 ：primary = B
console.log(runs); // 2

noise.set(1);
console.log(runs); // 2（noise 只在清理函数里被读过，不触发重跑）

stop(); // → 清理时 noise = 1（释放时也会执行最后一次清理）
