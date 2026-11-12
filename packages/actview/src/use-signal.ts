/**
 * @file 把 @slux/core 的 Subscribable 桥接为 actview 侧的只读 Ref，是各状态源适配 hook 的公共接入点。
 * 额外建立 effect 主动读取 source，以激活惰性 computed 的依赖追踪。
 */
import { effect } from "@slux/core";
import type { Subscribable } from "@slux/core";
import type { Ref } from "@actview/core";
import { bindExternal } from "./binding.js";

/**
 * 把 @slux/core 的 Subscribable 桥接为 actview 的只读 Ref，是各状态源适配 hook 共用的读取与订阅入口。
 * @typeParam T 源承载的值类型，也是返回 Ref 的值类型
 * @param source Subscribable<T> 实例，须提供 get() 读取与 subscribe(notify) 订阅，后者返回一个注销函数
 * @returns 只读 Ref<T>，值为 source.get() 的快照并随订阅刷新，随作用域释放失效
 * @throws 继承 bindExternal 的上下文校验：无活动组件实例且无 effect scope 时抛错
 * @remarks @slux/core 的 computed 为惰性求值，仅订阅而不触发读取不会登记依赖，依赖变化便无法进入订阅链路；故在订阅回调内额外建立 effect 主动 get，补齐这条依赖追踪时序。
 * @see bindExternal 订阅与生命周期的实际托管方；useAtomValue、useFluxStore、useObservable、useMachine 等均经本函数接入 signal 链路
 */
export function useSignal<T>(source: Subscribable<T>): Readonly<Ref<T>> {
  return bindExternal(
    () => source.get(),
    (notify) => {
      const unsubscribe = source.subscribe(notify);
      // core computed 惰性求值：主动读取使依赖被登记，依赖变化才能进入订阅链路。
      const dispose = effect(() => {
        source.get();
      });
      return () => {
        unsubscribe();
        dispose();
      };
    },
  );
}
