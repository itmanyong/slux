import { atom } from "@slux/atom";

const callback = atom<(() => number) | undefined>(undefined);
const fn = () => 42;

callback.set(fn); // 函数本身被保存，不会被 core 当作 recipe 执行
console.log(typeof callback.get()); // → 预期输出: function
console.log(callback.get()!()); // → 预期输出: 42
callback.update(() => fn);
console.log(callback.get() === fn); // → 预期输出: true
