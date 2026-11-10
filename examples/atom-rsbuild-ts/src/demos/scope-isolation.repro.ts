import { atom, createAtomScope, derived } from "@slux/atom";

const count = atom(0);
const doubled = derived((get) => get(count) * 2);
const request = createAtomScope();

request.set(count, 100);
console.log(request.get(count)); // → 预期输出: 100
console.log(request.get(doubled)); // 派生在作用域内独立计算 → 预期输出: 200
console.log(count.get()); // 默认作用域不受影响 → 预期输出: 0

const stop = request.sub(doubled, (value) => console.log("doubled:", value));
request.set(count, 105); // → 预期输出: doubled: 210
stop();
