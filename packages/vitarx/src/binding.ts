/**
 * @file vitarx 适配层的外部源绑定核心：把「读取 / 订阅 / 相等比较」回调桥接为只读 ShallowRef 并托管订阅生命周期。
 * SSR 下短路为初始快照、不订阅；非 SSR 必须有活动 effect scope，订阅经 onScopeDispose 随作用域销毁释放。
 */
import { getActiveScope, isSSR, onScopeDispose, shallowRef } from "vitarx";
import type { ShallowRef } from "vitarx";

/**
 * 把外部可变源桥接为 vitarx 的只读 ShallowRef：以 get 读快照、以 subscribe 订阅变更、以 equals 判定是否写回。
 * @typeParam T 外部源的值类型
 * @param get 读取当前值的回调，初始取值与每次通知时调用，应无副作用
 * @param subscribe 注册变更通知的回调，接收注入的 notify，须返回注销函数
 * @param equals 比较旧值与新值，返回 true 表示相等、跳过写回；默认 Object.is
 * @returns 只读 ShallowRef<T>；SSR 下仅为初始快照、不会刷新
 * @throws 非 SSR 且无活动 effect scope 时抛出 Error（服务端没有可挂载注销钩子的宿主，继续会泄漏订阅）
 * @remarks 订阅建立后立即 update() 对齐一次，覆盖注册期间可能错过的变更
 * @see useStore、useSnapshot 等适配 hook 以本函数为绑定入口
 */
export function bindExternal<T>(
  get: () => T,
  subscribe: (notify: () => void) => () => void,
  equals: (a: T, b: T) => boolean = Object.is,
): Readonly<ShallowRef<T>> {
  // 服务端没有可释放订阅的 effect scope，直接返回初始快照，避免建立无法注销的订阅。
  if (isSSR()) return shallowRef<T>(get());
  if (!getActiveScope()) throw new Error("Slux bindings require an active vitarx effect scope.");
  const value = shallowRef<T>(get());
  const update = () => {
    const next = get();
    if (!equals(value.value, next)) value.value = next;
  };
  const dispose = subscribe(update);
  onScopeDispose(dispose);
  update();
  return value;
}
