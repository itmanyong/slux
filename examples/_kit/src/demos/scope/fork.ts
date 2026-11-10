import { createScope, runInScope, signal } from "@slux/core";
import { defineDemo } from "../../types.js";

export const scopeFork = defineDemo({
  id: "scope-fork",
  api: "scope",
  apiLabel: "scope.fork()",
  title: "子作用域动态继承父级",
  summary: "fork 出来的子作用域在读取时回溯父级：自己没覆盖就取父级的值；自己覆盖后只影响自己。",
  create({ log }) {
    const theme = signal("light");
    const parent = createScope();
    parent.set(theme, "dusk");
    const child = parent.fork();

    return {
      readouts: [
        {
          kind: "flow",
          label: "全局 → 父 → 子",
          read: () => [
            { label: "全局 signal", value: theme.get() },
            { label: "父作用域", value: parent.get(theme) },
            { label: "子作用域", value: child.get(theme) },
          ],
        },
      ],
      actions: [
        {
          id: "child",
          label: "子作用域覆盖 solar",
          primary: true,
          run: () => {
            runInScope(child, () => child.set(theme, "solar"));
            log(`子作用域 = ${child.get(theme)}，父作用域仍是 ${parent.get(theme)}`, "scope");
          },
        },
        {
          id: "parent",
          label: "父作用域改为 dawn",
          run: () => {
            parent.set(theme, "dawn");
            log(`父作用域 = dawn；子作用域有自己的覆盖，仍是 ${child.get(theme)}`, "scope");
          },
        },
        {
          id: "inherit",
          label: "重建子作用域（继承）",
          run: () => {
            const next = parent.fork();
            log(`新子作用域读取到父级的值 ${next.get(theme)}`, "scope");
          },
        },
        {
          id: "global",
          label: "全局写入 noon",
          run: () => {
            theme.set("noon");
            log("全局变化不影响已有覆盖，只影响没有覆盖的读取", "write");
          },
        },
      ],
    };
  },
});
