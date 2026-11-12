/**
 * @file 生成 @slux/vitarx 包的批量自动导入配置，供自动导入工具在构建期消费；符号清单须与包的实际导出保持同步。
 */
import { generateBatchAutoImports } from "@slux/shared";

/**
 * vitarx 包对外自动导入的符号名清单。
 * 须与 @slux/vitarx 的实际导出保持一致，否则注入的 import 会在编译期找不到对应导出。
 * @remarks 工厂 createAutoImportApis 自身不列入。
 */
const allImportApis: string[] = ["SCOPE_KEY", "provideScope", "useScope", "useSignal"];

/**
 * 生成 vitarx 包的批量自动导入配置，供自动导入工具在构建期使用。
 * 委托 @slux/shared 的 generateBatchAutoImports 统一生成，使各包遵循同一份配置结构。
 * 这是构建/配置期工厂，不是运行时 hook，不依赖 vitarx 组件或 effect scope 上下文。
 * @param prefix 导入名前缀，默认空串表示不加前缀
 * @returns 批量自动导入配置，仅描述导入，不执行任何运行时注册
 * @see generateBatchAutoImports 实际的配置生成实现；allImportApis 被生成的符号清单
 */
export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/vitarx",
      imports: allImportApis,
    },
  ]);
};
