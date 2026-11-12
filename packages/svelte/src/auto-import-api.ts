/**
 * @file Svelte 适配层的自动导入 API 生成器：声明本包可自动导入的符号名，并生成批量自动导入配置。
 */

import { generateBatchAutoImports } from "@slux/shared";

/**
 * 本包可自动导入的符号名清单，与本包公共导出一一对应。
 * @remarks 仅作为配置数据，改动清单不会改变运行时导出
 */
const allImportApis: string[] = ["SCOPE_KEY", "getScope", "setScope", "toReadable", "toWritable"];

/**
 * 生成 @slux/svelte 的批量自动导入配置。
 * @param prefix 导入符号名的前缀，默认 "" 表示不加前缀
 * @returns 批量自动导入配置，具体结构由 @slux/shared 决定
 * @see generateBatchAutoImports
 */
export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/svelte",
      imports: allImportApis,
    },
  ]);
};
