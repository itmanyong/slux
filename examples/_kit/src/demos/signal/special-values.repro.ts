// 函数值、undefined 与有符号零：set(() => fn) · Object.is
import { signal } from "@slux/core";

// 函数参数一律当作更新回调，保存函数本身要再包一层
const callback = signal<() => string>(() => "hello");
callback.set(() => () => "world");
console.log(callback.get()()); // world

// undefined 可以直接作为值写入
const optional = signal<string | undefined>("ready");
optional.set(undefined);
console.log(optional.get()); // undefined

// 默认用 Object.is 比较：NaN 等于 NaN，+0 与 −0 不相等
const number = signal(NaN);
let notified = 0;
number.subscribe(() => {
  notified += 1;
});

number.set(NaN);
console.log(notified); // 0（NaN → NaN 视为相等，不通知）

number.set(0);
number.set(-0);
console.log(notified); // 2（0 与 −0 每次切换都通知）
