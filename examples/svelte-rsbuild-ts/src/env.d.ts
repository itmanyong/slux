declare module "*.css";

declare module "*.svelte" {
  import type { Component } from "svelte";
  const component: Component;
  export default component;
}

/** 构建期通过 with { type: "text" } 读取的示例源码，内容与源文件逐字节一致。 */
declare module "*.svelte" with { type: "text" } {
  const content: string;
  export default content;
}
