// 作用域写入不惊动全局：scope.set · 不触发订阅
import { createScope, runInScope, signal } from "@slux/core";

const count = signal(0);
const scope = createScope();
let notifications = 0;

const unsubscribe = count.subscribe(() => {
  notifications += 1;
});

// scope.set 只改覆盖值：不产生信号通知，订阅与 effect 都不会运行
runInScope(scope, () => scope.set(count, 99));
console.log(notifications); // 0（全局订阅没有收到任何通知）
console.log(scope.get(count)); // 99
console.log(count.get()); // 0（全局值未被改写）

// 全局写入才照常广播
count.set(1);
console.log(notifications); // 1

unsubscribe();
