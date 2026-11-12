/**
 * @file 通用工具 runAll：顺序执行一批同步任务并延后统一抛错。
 */
/**
 * 执行全部同步任务，全部结束后再统一抛出错误，避免首个失败阻断其余任务。
 * 单个失败抛原始错误；多个失败聚合为 AggregateError，顺序与任务执行顺序一致。
 * @param tasks 待执行的同步任务集合，按迭代顺序逐个调用
 * @returns 无返回值；全部成功时不抛错
 * @throws 恰有一个失败时抛原始错误；多个失败时抛 AggregateError(errors, "多个任务执行失败")
 */
export function runAll(tasks: Iterable<() => void>): void {
  const errors: unknown[] = [];
  for (const task of tasks) {
    try {
      task();
    } catch (error) {
      // 暂存而非吞掉：留到全部任务结束后统一抛出。
      errors.push(error);
    }
  }
  if (errors.length === 1) throw errors[0];
  if (errors.length > 1) throw new AggregateError(errors, "多个任务执行失败");
}
