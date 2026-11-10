// 子作用域动态继承父级：scope.fork()
import { createScope, signal } from "@slux/core";

const theme = signal("light");
const parent = createScope();
parent.set(theme, "dusk");

// fork 出来的子作用域在读取时回溯父级
const child = parent.fork();
console.log(parent.get(theme)); // dusk
console.log(child.get(theme)); // dusk（自己没覆盖，取父级的值）

// 子作用域覆盖后只影响自己
child.set(theme, "solar");
console.log(child.get(theme)); // solar
console.log(parent.get(theme)); // dusk

// 重建子作用域即可重新继承父级
const next = parent.fork();
console.log(next.get(theme)); // dusk
