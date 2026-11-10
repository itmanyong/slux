// 写入返回之前就已经跑完：effect(fn)
import { effect, signal } from "@slux/core";

const count = signal(0);
let runs = 0;

// effect 创建时同步执行一次
const stop = effect(() => {
  runs += 1;
  console.log("第", runs, "次运行：读到", count.get());
}); // → 第 1 次运行：读到 0
console.log("创建完成时的运行次数：", runs); // 1

// 依赖变化时，set() 返回之前就已同步重跑
count.set(1); // → 第 2 次运行：读到 1
console.log("set 返回时的运行次数：", runs); // 2

// 相同值写入不会重跑
count.set(1);
console.log("相同值写入后的运行次数：", runs); // 2

stop();
