// 结果相等就到此为止：computed(fn, { equals })
import { computed, effect, signal } from "@slux/core";

const count = signal(0);
let computes = 0;
let runs = 0;

// 用 equals 声明「结果没变就视为相等」
const parity = computed(
  () => {
    computes += 1;
    return count.get() % 2 === 0 ? "偶数" : "奇数";
  },
  { equals: (previous, next) => previous === next },
);

const stop = effect(() => {
  runs += 1;
  console.log("effect 看到奇偶：", parity.get());
});
// → effect 看到奇偶： 偶数

count.set(1); // → effect 看到奇偶： 奇数
console.log(computes); // 2
console.log(runs); // 2

// 结果相等：computed 重算，但下游 effect 不重跑
count.set(3);
console.log(computes); // 3
console.log(runs); // 2

stop();
