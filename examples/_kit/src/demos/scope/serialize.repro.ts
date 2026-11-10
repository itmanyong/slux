// 只导出自己的覆盖值：serializeScope / scope.serialize
import { createScope, serializeScope, signal } from "@slux/core";

const count = signal(0);
const label = signal("main");

const parent = createScope();
parent.set(count, 10);
const child = parent.fork();
child.set(label, "child");

// 序列化输出普通对象，只包含本作用域显式赋值过的条目
console.log(JSON.stringify(serializeScope(parent))); // → {"__scope_0":10}
console.log(JSON.stringify(serializeScope(child))); // → {"__scope_1":"child"}

// 子作用域也有等价的实例方法
console.log(JSON.stringify(child.serialize())); // → {"__scope_1":"child"}

// 键名由 core 内部按信号分配，同一进程内保持稳定
console.log(Object.keys(serializeScope(child))); // → ["__scope_1"]
console.log(Object.keys(serializeScope(child))); // → ["__scope_1"]
