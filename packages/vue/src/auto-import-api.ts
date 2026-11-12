/**
 * @file 声明 Vue 适配层对外可自动导入的符号名，并提供 createAutoImportApis 生成批量自动导入配置。
 */

import { generateBatchAutoImports } from "@slux/shared";

/**
 * 本包对外暴露、可被自动导入的符号名清单，与 index.ts 的实际导出一一对应。
 * @remarks 仅作为配置数据，改动清单不会改变运行时导出；每项须与实际导出的符号名一致，
 *          否则生成的导入会指向不存在的名字。
 */
const allImportApis: string[] = ["ScopeProvider", "provideScope", "sluxPlugin", "useScope", "useSignal", "useStore"];

/**
 * 生成 @slux/vue 的批量自动导入配置，向生成器提供符号清单与来源包名。
 * @param prefix 导入符号名的前缀，默认空串表示不加前缀、使用原始名称
 * @returns generateBatchAutoImports 产出的配置对象
 * @see generateBatchAutoImports
 */
export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/vue",
      imports: allImportApis,
    },
  ]);
};
