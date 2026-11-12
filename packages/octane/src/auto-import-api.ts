/**
 * @file octane 适配层的自动导入 API 生成器：声明可供自动导入的符号名，并生成批量自动导入配置。
 */

import { generateBatchAutoImports } from "@slux/shared";

/**
 * 本包可供自动导入的符号名清单，集中维护以避免生成配置与导出入口各写一份。
 */
const allImportApis: string[] = ["ScopeContext", "ScopeProvider", "useScopeContext", "useSignal"];

/**
 * 生成 octane 适配层的批量自动导入配置。
 * @param prefix 自动导入符号使用的前缀，默认 ""
 * @returns 批量自动导入配置，具体结构由 @slux/shared 决定
 * @see allImportApis 生成时使用的符号名清单
 */
export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/octane",
      imports: allImportApis,
    },
  ]);
};
