import { atom, derived } from "@slux/atom";

const mode = atom<"double" | "triple">("double");
const x = atom(1);
const y = atom(1);
const result = derived((get) => (get(mode) === "double" ? get(x) * 2 : get(y) * 3));

result.subscribe((value) => console.log("result:", value)); // 不立即通知
x.set(10); // double 分支生效 → 预期输出: result: 20
mode.set("triple"); // 分支切换，x 不再是依赖 → 预期输出: result: 3
y.set(4); // 只有 triple 分支重算 → 预期输出: result: 12
console.log(result.get()); // → 预期输出: 12
