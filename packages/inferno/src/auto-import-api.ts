/**
 * @file 自动导入 API 生成器：声明本包可供自动导入的符号名，并据此生成批量自动导入配置。
 */

import { generateBatchAutoImports } from "@slux/shared";

/**
 * 本包可供自动导入的符号名清单，以常量集中维护，避免生成配置与导出入口各写一份。
 */
const allImportApis: string[] = ["ScopeProvider", "SignalValue", "getScope"];

/**
 * 生成本包的批量自动导入配置：单条配置即可覆盖全部符号。
 * @param prefix 自动导入符号使用的前缀，默认空字符串
 * @returns 批量自动导入配置，具体结构由 @slux/shared 决定
 */
export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/inferno",
      imports: allImportApis,
    },
  ]);
};
