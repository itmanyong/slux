/**
 * @file 定义 proxy 包可自动导入的 API 清单，并委托 @slux/shared 生成对应的自动导入配置。
 */
import { generateBatchAutoImports } from "@slux/shared";

/**
 * proxy 包对外暴露、可被自动导入的 API 名称清单。
 */
const allImportApis: string[] = ["observable", "observe", "ref", "snapshot", "subscribe"];

/**
 * 生成 proxy 包的自动导入 API 配置。
 * @param prefix 自动导入符号的前缀，默认 "" 表示不加前缀。
 * @returns generateBatchAutoImports 的生成结果，原样透传。
 * @see generateBatchAutoImports
 */
export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/proxy",
      imports: allImportApis,
    },
  ]);
};
