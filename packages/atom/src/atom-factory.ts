/**
 * @file atom 包中参数化原子工厂的缓存实现：按参数记忆 factory 产物，并支持按参数驱逐缓存。
 */

/**
 * 创建参数化工厂的记忆函数：相同参数复用同一份 Result，仅在未命中时调用 factory 生成并缓存。
 * @typeParam Param 工厂入参类型，同时作为缓存键；相等性由 Map 的键比较语义决定
 * @typeParam Result 工厂返回值类型，可为任意值；命中时原样返回缓存中的同一引用
 * @param factory 由参数生成 Result 的函数，仅在缓存未命中时被调用
 * @returns 附带 remove 方法的 get 函数；remove 返回 true 表示该参数曾存在且已删除，false 表示原本不存在
 * @remarks 用 has 判断存在性而非依赖取值结果，使任意 Result 都能作为有效缓存值（包括 undefined）；
 *          缓存随闭包长期持有，需调用方用 remove 显式释放
 */
export function atomFactory<Param, Result>(factory: (param: Param) => Result): ((param: Param) => Result) & { remove(param: Param): boolean } {
  const cache = new Map<Param, Result>();
  const get = (param: Param): Result => {
    if (cache.has(param)) return cache.get(param) as Result;
    const value = factory(param); // 若抛错则向上传播，此时缓存尚未写入，不会留下半写入条目
    cache.set(param, value);
    return value;
  };
  get.remove = (param: Param) => cache.delete(param);
  return get;
}
