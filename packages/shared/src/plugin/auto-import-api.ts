/**
 * @file 自动导入插件辅助：把 AutoImportsConfig 转换为 unplugin-auto-import 所需的 ImportsMap，
 * 支持单条与批量生成，仅在构建/配置期被消费。
 */
import type { ImportsMap } from "unplugin-auto-import/types";

/**
 * 单条自动导入配置：prefix 为导入名前缀，imports 为符号名列表，fromName 为来源包名，三者均可选。
 */
export interface AutoImportsConfig {
  /** 导入名前缀，省略表示不加前缀。 */
  prefix?: string;
  /** 待自动导入的符号名列表。 */
  imports?: string[];
  /** 导入来源包名，作为 ImportsMap 的键。 */
  fromName?: string;
}
/**
 * 把一条 AutoImportsConfig 转换为 ImportsMap：以 fromName 为键，imports 映射为「原始名 → 别名」条目。
 * @param options 自动导入配置，缺 imports 或 fromName 时返回空对象
 * @returns 形如 { [fromName]: [原始名, 别名][] } 的 ImportsMap，为新建对象
 * @remarks prefix 以小写字母结尾时，符号名首字母会先大写再拼接，避免拼出无分隔的小写连写。
 * @see generateBatchAutoImports
 */
export const createAutoImports = ({ prefix, imports, fromName }: AutoImportsConfig = {}): ImportsMap => {
  if (!imports || !fromName) {
    return {};
  }
  // prefix 以小写字母结尾时直接拼接会产生连写，故把符号名首字母大写以作分隔。
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
 * 批量把多条 AutoImportsConfig 合并为一个 ImportsMap，供自动导入插件一次性使用。
 * @param apis 配置列表，按数组顺序合并；空数组返回空 ImportsMap
 * @returns 合并后的 ImportsMap；同一 fromName 的导入按出现顺序追加合并而非覆盖
 * @see createAutoImports
 */
export const generateBatchAutoImports = (apis: Array<AutoImportsConfig>): ImportsMap => {
  return apis.reduce((prev, item) => {
    const autoImports = createAutoImports(item);
    // 同一 fromName 已存在于累积结果时，把新导入原地追加到已有数组，避免覆盖先前条目。
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
