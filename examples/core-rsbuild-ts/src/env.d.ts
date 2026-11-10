declare module "*.css";

/** 构建期通过 ?raw 读取的示例源码，内容与源文件逐字节一致。 */
declare module "*?raw" {
  const content: string;
  export default content;
}
