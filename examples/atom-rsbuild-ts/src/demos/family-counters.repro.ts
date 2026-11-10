import { atom, atomFamily } from "@slux/atom";

const counts = atomFamily((_id: string) => atom(0));

console.log(counts("a") === counts("a")); // 同参数复用 → 预期输出: true
counts("a").update((value) => value + 1);
console.log(counts("a").get()); // → 预期输出: 1
console.log(counts.remove("a")); // 仅移除缓存 → 预期输出: true
console.log(counts("a").get()); // 重建后从 0 开始 → 预期输出: 0
