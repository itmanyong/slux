/**
 * @file @slux/solid 的自动导入 API 清单与批量配置生成 createAutoImportApis。
 */

import { generateBatchAutoImports } from "@slux/shared";

/**
 * 本包对外暴露、可被自动导入的符号名清单，与 index.ts 中的实际导出一一对应。
 * @remarks 每项须与实际导出的符号名一致，否则生成的导入会指向不存在的名字。
 */
const allImportApis: string[] = ["ScopeContext", "ScopeProvider", "useScope", "useSignal", "useStore"];

/**
 * 生成 @slux/solid 的批量自动导入配置，向生成器提供符号清单与来源包名。
 * @param prefix 导入符号名的前缀，默认空串表示使用原始名称。
 * @returns generateBatchAutoImports 产出的配置对象。
 * @see generateBatchAutoImports
 */
export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/solid",
      imports: allImportApis,
    },
  ]);
};
