/**
 * @file 汇总 @slux/store 可批量自动导入的符号，并生成自动导入配置。
 */
import { generateBatchAutoImports } from "@slux/shared";

/** 可从 @slux/store 自动导入的符号名，须与包的实际导出名一致。 */
const allImportApis: string[] = ["createStore"];

/**
 * 构造 store 包的批量自动导入配置。
 * @param prefix 自动导入名的前缀，缺省不加前缀。
 * @returns 批量自动导入配置。
 * @see generateBatchAutoImports
 */
export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/store",
      imports: allImportApis,
    },
  ]);
};
