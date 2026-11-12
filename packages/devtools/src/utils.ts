/**
 * @file devtools 内部工具函数。
 */

/**
 * 根据局部状态更新的字段名推导稳定的 action 名称（形如 `set:a,b`），供 devtools 时间线归并同类更新。
 * 字段名先排序再拼接，使键集合相同但书写顺序不同的更新得到同一名称。
 * @param partial 局部状态对象，仅读取其自有键；空对象返回 "setState"。
 */
export function deriveActionName(partial: Record<string, unknown>): string {
  const keys = Object.keys(partial);
  if (keys.length === 0) return "setState";
  keys.sort();
  return `set:${keys.join(",")}`;
}
