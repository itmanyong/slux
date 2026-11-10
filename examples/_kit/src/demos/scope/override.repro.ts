// 同一份信号，两个读法：createScope / runInScope
import { createScope, runInScope, signal } from "@slux/core";

const count = signal(0);
const scope = createScope();

// 作用域只保存自己的覆盖值：全局值不受影响
runInScope(scope, () => {
  scope.set(count, 10);
  console.log("作用域内 scope.get(count)：", scope.get(count)); // 10
  console.log("同一时刻 count.get()：", count.get()); // 0（全局未被改写）
});

// 换一个没有任何覆盖值的新作用域，读取回落到全局值
const fresh = createScope();
console.log(fresh.get(count)); // 0
