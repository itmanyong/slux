declare module "*.css";

declare module "*.vue" {
  import type { Component } from "vue";
  const component: Component;
  export default component;
}

/** 构建期通过 with { type: "text" } 读取的示例源码，内容与源文件逐字节一致。 */
declare module "*.vue" with { type: "text" } {
  const content: string;
  export default content;
}
