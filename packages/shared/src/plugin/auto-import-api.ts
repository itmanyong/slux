import type { ImportsMap } from "unplugin-auto-import/types";

export interface AutoImportsConfig {
  prefix?: string;
  imports?: string[];
  fromName?: string;
}
/**
 * 创建自动导入配置
 * @param options 自动导入配置
 * @param options.prefix 自动导入前缀
 * @param options.imports 自动导入的模块列表
 * @param options.fromName 自动导入的模块来源名称
 * @returns 自动导入配置
 */
export const createAutoImports = ({ prefix, imports, fromName }: AutoImportsConfig = {}): ImportsMap => {
  if (!imports || !fromName) {
    return {};
  }
  const capitalizeImportName = prefix ? /[a-z]$/.test(prefix) : false;
  const packageImports = prefix
    ? imports.map((name): [string, string] => [
        name,
        `${prefix}${capitalizeImportName ? `${name?.at(0)?.toUpperCase()}${name.slice(1)}` : name}`,
      ])
    : [...imports];

  return {
    [fromName]: packageImports,
  };
};

/**
 * 批量创建自动导入配置
 * @param apis 自动导入配置列表
 * @returns 批量自动导入配置
 */
export const generateBatchAutoImports = (apis: Array<AutoImportsConfig>): ImportsMap => {
  return apis.reduce((prev, item) => {
    const autoImports = createAutoImports(item);
    // 如果已经有导入来源声明就直接用
    if (item.fromName && autoImports[item.fromName] && prev[item.fromName]) {
      prev[item.fromName]!.push(...autoImports[item.fromName]!);
      return prev;
    }
    prev = {
      ...prev,
      ...createAutoImports(item),
    };
    return prev;
  }, {} as ImportsMap);
};
