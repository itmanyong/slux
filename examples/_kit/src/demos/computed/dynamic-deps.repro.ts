// 只跟踪这次真正读到的分支：computed · 动态依赖
import { computed, signal } from "@slux/core";

const branch = signal<"left" | "right">("left");
const left = signal(1);
const right = signal(100);

let computes = 0;
const picked = computed(() => {
  computes += 1;
  return branch.get() === "left" ? left.get() : right.get();
});

// 本次求值只跟踪真正读到的分支（branch + left）
console.log(picked.get()); // 1
console.log(computes); // 1

// right 不在依赖里：变化不会让 computed 失效
right.set(200);
console.log(picked.get()); // 1（命中缓存，没有重算）
console.log(computes); // 1

// 切换分支后依赖重建
branch.set("right");
console.log(picked.get()); // 200
console.log(computes); // 2
