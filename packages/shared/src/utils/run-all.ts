/** 执行全部同步任务，结束后再抛出错误，防止一个失败阻断其余任务。 */
export function runAll(tasks: Iterable<() => void>): void {
  const errors: unknown[] = [];
  for (const task of tasks) {
    try {
      task();
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length === 1) throw errors[0];
  if (errors.length > 1) throw new AggregateError(errors, "多个任务执行失败");
}
