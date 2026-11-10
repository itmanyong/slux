import { atom } from "@slux/atom";

const count = atom(0);
count.subscribe((value) => console.log("count:", value)); // 订阅不立即通知

count.set(2); // → 预期输出: count: 2
count.update((value) => value + 1); // → 预期输出: count: 3
console.log(count.get()); // → 预期输出: 3
