import { observable, observe } from "@slux/proxy";

const state = observable({ a: 0, b: 0 });
let runs = 0;

const dispose = observe(() => {
  runs += 1;
  console.log(`run ${runs}: a = ${state.a}`);
}); // 创建时立即执行一次 → 预期输出: run 1: a = 0

state.a += 1; // 读取过的属性 → 预期输出: run 2: a = 1
state.b += 1; // 未读取的属性，不重跑
console.log(runs); // → 预期输出: 2

dispose();
