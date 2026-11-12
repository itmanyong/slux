/** @file core 包自动导入 API 配置生成。 */
import { generateBatchAutoImports } from "@slux/shared";

/** core 包对外可自动导入的公共符号清单。 */
const allImportApis: string[] = ["batch", "computed", "createScope", "effect", "runInScope", "serializeScope", "signal"];

/**
 * 生成 core 包的自动导入 API 配置。
 * @param prefix 导入标识前缀。
 */
export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/core",
      imports: allImportApis,
    },
  ]);
};
