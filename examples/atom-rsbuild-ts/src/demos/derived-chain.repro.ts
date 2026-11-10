import { atom, derived } from "@slux/atom";

const a = atom(2);
const b = atom(3);
const total = derived((get) => get(a) + get(b));

total.subscribe((value) => console.log("total:", value)); // 不立即通知
a.set(5); // → 预期输出: total: 8
b.set(10); // → 预期输出: total: 15
console.log(total.get()); // → 预期输出: 15
