/**
 * @file 生成 @slux/flux 包的批量自动导入配置，供自动导入工具在构建期消费。
 * 仅提供符号清单与来源包名，配置结构由 @slux/shared 的 generateBatchAutoImports 统一产出。
 */
import { generateBatchAutoImports } from "@slux/shared";

/**
 * 包对外自动导入的符号名清单，当前仅含运行时工厂 createFluxStore（类型不自动导入）。
 * @remarks 须与 @slux/flux 的实际导出保持同步，否则构建期注入的 import 在编译期找不到对应导出
 */
const allImportApis: string[] = ["createFluxStore"];

/**
 * 生成 @slux/flux 包的批量自动导入配置，委托 @slux/shared 统一产出以避免重复实现格式细节。
 * @param prefix 导入名前缀，默认空串表示不加前缀
 * @returns 批量自动导入配置，仅在编译期被消费，不做任何运行时注册
 * @see generateBatchAutoImports 配置生成实现；allImportApis 被生成的符号清单
 */
export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/flux",
      imports: allImportApis,
    },
  ]);
};
