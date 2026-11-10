import { observable, subscribe } from "@slux/proxy";

const state = observable<{
  count: number;
  user: { name: string };
  extra?: boolean;
}>({
  count: 0,
  user: { name: "Alice" },
});
subscribe(state, () => console.log("changed:", state.count, state.user.name)); // 不立即调用

state.count++; // → 预期输出: changed: 1 Alice
state.user.name = "Bob"; // 深层属性直接改 → 预期输出: changed: 1 Bob
state.extra = true; // 新增属性也改变结构 → 预期输出: changed: 1 Bob
