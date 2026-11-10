import { observable, snapshot } from "@slux/proxy";

const state = observable({ count: 0, user: { name: "Alice" } });
const first = snapshot(state);

state.count += 1;
const second = snapshot(state);
console.log(second !== first); // 顶层新建 → 预期输出: true
console.log(second.user === first.user); // 未变子树共享 → 预期输出: true
console.log(snapshot(state) === second); // 版本未变复用缓存 → 预期输出: true
console.log(second.count); // → 预期输出: 1
