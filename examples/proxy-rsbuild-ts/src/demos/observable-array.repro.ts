import { observable, subscribe } from "@slux/proxy";

const todos = observable<{ text: string; done: boolean }[]>([]);
subscribe(todos, () => console.log("length:", todos.length)); // 不立即调用

todos.push({ text: "learn proxy", done: false }); // → 预期输出: length: 1
todos.push({ text: "build demo", done: true }); // → 预期输出: length: 2
todos[0]!.done = true;
todos.length = 1; // 截断 → 预期输出: length: 1
console.log(todos[0]?.text); // → 预期输出: learn proxy
