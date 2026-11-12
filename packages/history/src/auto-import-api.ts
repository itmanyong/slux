/**
 * @file 生成 history 包的批量自动导入配置。
 */
import { generateBatchAutoImports } from "@slux/shared";

/**
 * 可从 @slux/history 自动导入的符号名清单，取值须与包实际导出一致。
 */
const allImportApis: string[] = ["history"];

/**
 * 构造 @slux/history 的批量自动导入配置。
 * @param prefix 符号名前缀，缺省为空串（不加前缀）
 * @returns generateBatchAutoImports 的返回值
 * @see generateBatchAutoImports
 */
export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/history",
      imports: allImportApis,
    },
  ]);
};
