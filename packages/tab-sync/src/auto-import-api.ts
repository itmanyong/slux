/**
 * @file 生成 tab-sync 包的批量自动导入配置。
 */

import { generateBatchAutoImports } from "@slux/shared";

/**
 * tab-sync 包可自动导入的符号名清单，新增可自动导入的符号时需同步维护。
 */
const allImportApis: string[] = ["broadcast"];

/**
 * 生成 @slux/tab-sync 的批量自动导入配置。
 * @param prefix 符号名前缀，缺省为空串（不加前缀）
 * @returns generateBatchAutoImports 的返回值
 * @see generateBatchAutoImports
 */
export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/tab-sync",
      imports: allImportApis,
    },
  ]);
};
