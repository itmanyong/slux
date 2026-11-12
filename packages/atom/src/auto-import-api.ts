/**
 * @file atom 包的自动导入 API 生成器：声明本包对外符号名，并据此生成批量自动导入配置。
 * 生成逻辑由 @slux/shared 承担，注册由调用方或构建工具完成。
 */

import { generateBatchAutoImports } from "@slux/shared";

/**
 * 本包对外暴露、可供自动导入的符号名清单。
 * 以常量集中维护，避免生成配置与导出桶文件各写一份。
 */
const allImportApis: string[] = ["atom", "atomFactory", "createAtomScope", "derived", "writableAtom"];

/**
 * 生成 atom 包的批量自动导入配置：把符号清单与来源模块名包装成一条配置后交给 generateBatchAutoImports。
 * @param prefix 自动导入符号使用的前缀，默认为空字符串
 * @returns 批量自动导入配置，具体结构由 @slux/shared 决定
 * @see allImportApis 生成时使用的符号名清单
 */
export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/atom",
      imports: allImportApis,
    },
  ]);
};
