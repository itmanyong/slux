/**
 * @file 汇总 @slux/storage 可自动导入的符号清单，并调用共享生成器生成批量自动导入配置。
 */
import { generateBatchAutoImports } from "@slux/shared";

/**
 * 可从 @slux/storage 自动导入的符号名清单，须与包的实际导出名保持一致。
 */
const allImportApis: string[] = [
  "PERSIST_ERROR_CODE",
  "cookieStorage",
  "indexedDBStorage",
  "localStorageBackend",
  "memoryStorage",
  "persist",
  "sessionStorageBackend",
];

/**
 * 构造 storage 包的批量自动导入配置。
 * @param prefix 自动导入名的前缀，缺省为空字符串。
 * @returns 批量自动导入配置，由 generateBatchAutoImports 生成。
 * @see generateBatchAutoImports
 */
export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/storage",
      imports: allImportApis,
    },
  ]);
};
