// 由你定义什么算变化：SignalOptions.equals
import { signal } from "@slux/core";
import type { SignalOptions } from "@slux/core";

type User = { id: number; name: string };

// 默认用 Object.is 比较；传入自定义 equals 后，同 id 的新对象被视为相等
const options: SignalOptions<User> = {
  equals: (previous, next) => previous.id === next.id,
};

const user = signal<User>({ id: 1, name: "Ada" }, options);

user.subscribe((value) => {
  console.log("通知：", value.name, value.id);
});

const previous = user.get();

// id 相同：不提交、不通知，旧引用被保留
user.set({ id: 1, name: "Grace" }); // （无输出）
console.log(user.get().name); // Ada
console.log(previous === user.get()); // true

// id 变化：新对象被提交
user.set({ id: 2, name: "Lin" }); // → 通知： Lin 2
console.log(user.get().name); // Lin
