export function atomFamily<Param, Result>(factory: (param: Param) => Result): ((param: Param) => Result) & { remove(param: Param): boolean } {
  const cache = new Map<Param, Result>();
  const get = (param: Param): Result => {
    if (cache.has(param)) return cache.get(param) as Result;
    const value = factory(param);
    cache.set(param, value);
    return value;
  };
  get.remove = (param: Param) => cache.delete(param);
  return get;
}
