/**
 * @file 自动导入 API 清单：声明本包可自动导入的符号，并提供 createAutoImportApis 生成批量自动导入配置。
 */

import { generateBatchAutoImports } from "@slux/shared";

/**
 * 本包可自动导入的符号名清单，与 index.ts 中的实际导出一一对应。
 */
const allImportApis: string[] = ["ScopeContext", "ScopeProvider", "useScopeContext", "useSignal"];

/**
 * 生成 @slux/preact 的批量自动导入配置。
 * @param prefix 导入符号名的前缀，默认空串表示不加前缀
 * @returns generateBatchAutoImports 产出的配置对象
 * @remarks 本包只向一个来源注册导入项，故以单元素数组调用生成器
 * @see generateBatchAutoImports
 */
export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/preact",
      imports: allImportApis,
    },
  ]);
};
