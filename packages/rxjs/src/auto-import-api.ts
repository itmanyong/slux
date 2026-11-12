/**
 * @file @slux/rxjs 的自动导入配置：声明对外自动导入的符号清单，并委托 @slux/shared 生成构建期消费的批量导入配置。
 */
import { generateBatchAutoImports } from "@slux/shared";

/**
 * 对外自动导入的符号名清单，须与包的实际导出保持一致，否则编译期注入的 import 会找不到对应导出。
 * fromObservable 为 Observable → ObservableState 的投影，toObservable 为 Subscribable → Observable 的包装；工厂自身不列入。
 */
const allImportApis: string[] = ["fromObservable", "toObservable"];

/**
 * 生成 @slux/rxjs 的批量自动导入配置，供自动导入工具在构建期使用；配置结构由 @slux/shared 统一实现。
 * @param prefix 导入名前缀，默认空串表示不加前缀
 * @returns 批量自动导入配置，仅描述导入，不含任何运行时注册
 * @see generateBatchAutoImports 实际的配置生成实现
 */
export const createAutoImportApis = (prefix: string = "") => {
  return generateBatchAutoImports([
    {
      prefix,
      fromName: "@slux/rxjs",
      imports: allImportApis,
    },
  ]);
};
