/**
 * @file 声明 angular 适配层对外可自动导入的符号名，并据此生成批量自动导入配置。
 */

import { generateBatchAutoImports } from "@slux/shared";

/** angular 适配层对外暴露、可供自动导入的符号名清单，与导出桶文件保持一致。 */
const allImportApis: string[] = [
  "SLUX_SCOPE",
  "fromObservable",
  "injectScope",
  "injectStore",
  "provideSluxScope",
  "toAngularSignal",
  "toObservable",
];

/**
 * 生成 angular 适配层的批量自动导入配置：把符号清单与来源模块名包装成单条配置交给 generateBatchAutoImports。
 * @param prefix 自动导入符号使用的前缀，默认值为空字符串
 * @returns 批量自动导入配置，具体结构与所有权由 @slux/shared 决定
 * @see allImportApis 生成时使用的符号名清单
 */
export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/angular",
      imports: allImportApis,
    },
  ]);
};
