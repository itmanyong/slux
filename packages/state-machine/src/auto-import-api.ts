/**
 * @file state-machine 自动导入 API 描述生成入口，仅生成导入配置，不做注册与代码转换（由 @slux/shared 承担）。
 */

import { generateBatchAutoImports } from "@slux/shared";

/**
 * 本包可被自动导入的运行时符号名清单（不含纯类型导出与 createAutoImportApis 自身），新增符号时需同步维护。
 */
const allImportApis: string[] = ["createMachine"];

/**
 * 生成 state-machine 的批量自动导入 API 描述。
 * @param prefix 符号名前缀，缺省为空字符串（不加前缀）。
 * @returns 批量导入描述，结构由 @slux/shared 定义。
 */
export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/state-machine",
      imports: allImportApis,
    },
  ]);
};
