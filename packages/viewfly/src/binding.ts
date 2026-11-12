/**
 * @file viewfly 适配层的外部源绑定核心：定义只读访问器 Accessor，并把「读取 / 订阅 / 相等比较」三个回调桥接为访问器、托管订阅生命周期。
 * 订阅不在调用时建立，而是推迟到 onMounted 之后的下一个微任务（避开 Viewfly 挂载后重置更新标记的阶段），卸载时由 onMounted 的清理函数释放。
 */
import { createSignal, onMounted } from "@viewfly/core";
/**
 * viewfly 侧的只读访问器类型：无参调用即返回当前值。
 * 采用函数而非直接暴露值，是为了让调用方在读取时总拿到 signal 的最新快照，而非创建时捕获的旧值。
 * @typeParam T 访问器返回的值类型
 */
export type Accessor<T> = () => T;
/**
 * 把外部可变源桥接为 viewfly 的只读 Accessor：以 get 读快照、以 subscribe 订阅变更、以 equals 判定是否刷新，订阅随组件挂载/卸载生命周期建立与释放。
 * @typeParam T 外部源的值类型，也是 Accessor 的返回类型
 * @param get 读取当前值的回调，创建初值与每次刷新时调用，应只做读取、不应有副作用
 * @param subscribe 注册变更通知的回调，接收注入的 notify，须返回一个注销函数
 * @param equals 比较旧值与新值的函数，返回 true 表示相等、跳过写入；默认 Object.is
 * @returns () => T 形式的只读访问器，每次调用返回 signal 的当前值，不暴露写入通道
 * @throws 不捕获异常，get/subscribe/equals/createSignal 抛出的错误原样向上传递；onMounted 所需的调用上下文由 @viewfly/core 决定
 * @remarks 订阅在 onMounted 回调里经 queueMicrotask 推迟到下一微任务，以避开 Viewfly 在挂载回调后重置更新标记的时序；先 subscribe(update) 再 update() 立即对齐一次，防止订阅窗口内的变更被漏掉；若微任务尚未执行便已卸载，active 标志阻止建立订阅、dispose 经可选链静默跳过注销。
 * @see Accessor 返回的访问器类型；useStore、useSnapshot 等适配 hook 以本函数为绑定入口
 */
export function bindExternal<T>(
  get: () => T,
  subscribe: (notify: () => void) => () => void,
  equals: (a: T, b: T) => boolean = Object.is,
): Accessor<T> {
  const value = createSignal(get());
  // current 镜像上次写入 signal 的值，使 equals 的比较基准不随每次读取 signal 变化。
  let current = value();
  const update = () => {
    const next = get();
    if (!equals(current, next)) {
      current = next; // 先更新镜像，保证下次比较基于本次已确认写入的值
      value.set(next);
    }
  };
  onMounted(() => {
    let active = true; // 卸载后置 false，阻止尚未执行的微任务再建立订阅
    let dispose: (() => void) | undefined;
    // Viewfly 在挂载回调后会重置更新标记，因此推迟到下一微任务再订阅并校验快照。
    queueMicrotask(() => {
      if (active) {
        dispose = subscribe(update);
        update(); // 订阅建立后立即对齐一次最新值，覆盖注册期间可能错过的变更
      }
    });
    return () => {
      active = false;
      dispose?.();
    };
  });
  return () => value();
}
