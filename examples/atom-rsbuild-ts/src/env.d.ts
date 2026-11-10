declare module "*.css";

/** 构建期通过 ?raw 读取的最小复现源码，内容与源文件逐字节一致。 */
declare module "*?raw" {
  const content: string;
  export default content;
}
