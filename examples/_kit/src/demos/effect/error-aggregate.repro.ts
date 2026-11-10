// 一个报错不挡住另一个：effect · 错误汇总
import { effect, signal } from "@slux/core";

const value = signal(0);

// 两个 effect 都在 value ≥ 2 时抛错
const stopA = effect(() => {
  if (value.get() >= 2) throw new Error("effect A 拒绝");
  console.log("effect A 运行：", value.get());
}); // → effect A 运行： 0
const stopB = effect(() => {
  if (value.get() >= 2) throw new Error("effect B 拒绝");
  console.log("effect B 运行：", value.get());
}); // → effect B 运行： 0

// 多个 effect 同时抛错时，写入抛出 AggregateError；状态已经提交
try {
  value.set(2);
} catch (error) {
  if (error instanceof AggregateError) {
    console.log(error.errors.map((item) => (item as Error).message));
    // → ["effect A 拒绝","effect B 拒绝"]
  }
  console.log("写入后的 value：", value.get()); // 2（状态已提交）
}

stopA();
stopB();
