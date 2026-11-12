/**
 * @file telemetry 的自动导入 API 描述生成入口，基于 @slux/shared 的 generateBatchAutoImports 输出批量导入配置。
 */

import { generateBatchAutoImports } from "@slux/shared";

/**
 * telemetry 包可自动导入的运行时符号清单（不含纯类型导出与 createAutoImportApis 自身）；新增符号时需同步维护。
 */
const allImportApis: string[] = ["telemetry"];

/**
 * 生成 telemetry 的批量自动导入描述。
 * @param prefix 可选的符号名前缀，缺省为空字符串（不加前缀）。
 * @returns 批量导入描述，具体结构由 @slux/shared 定义。
 */
export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/telemetry",
      imports: allImportApis,
    },
  ]);
};
