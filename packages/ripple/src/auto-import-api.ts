/**
 * @file Ripple 适配层的自动导入 API 清单与批量配置生成。
 */

import { generateBatchAutoImports } from "@slux/shared";

/**
 * 本包可自动导入的符号名清单，须与 index.ts 的实际导出一致。
 */
const allImportApis: string[] = ["ScopeContext", "provideScope", "useScopeContext", "useSignal"];

/**
 * 生成 @slux/ripple 的批量自动导入配置。
 * @param prefix 导入符号名的前缀，默认空串表示不加前缀
 * @returns generateBatchAutoImports 产出的配置对象
 * @see generateBatchAutoImports
 */
export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/ripple",
      imports: allImportApis,
    },
  ]);
};
