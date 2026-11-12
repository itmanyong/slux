/**
 * @file @slux/flux 的公共类型契约：定义 action、reducer、dispatch、middleware、store 与构造选项的形状，不含运行时实现。
 */
import type { Subscribable } from "@slux/core";

/**
 * flux action 的基类型：至少携带一个只读的 type 字符串作为判别字段，reducer 与 middleware 按 type 区分动作。
 * @remarks 具体 action 可附带额外字段；readonly 表示派发过程中不应改写 type
 */
export type FluxAction = { readonly type: string };

/**
 * 状态归约函数：根据当前状态与一个 action 计算新状态。
 * @typeParam State store 的状态类型
 * @typeParam Action 受 FluxAction 约束的 action 类型
 * @param state 归约前的当前状态
 * @param action 触发本次归约的动作
 * @returns 归约后的新状态
 */
export type FluxReducer<State, Action extends FluxAction> = (state: State, action: Action) => State;

/**
 * 派发函数：把一个 action 送入 store 的 middleware 管道与归约流程，并将该 action 回传给调用方。
 * @typeParam Action 受 FluxAction 约束的 action 类型
 * @param action 要派发的动作
 * @returns 被派发的 action（是否同一实例由实现决定）
 */
export type FluxDispatch<Action extends FluxAction> = (action: Action) => Action;

/**
 * 提供给中间件的 store 视图：只暴露读取状态与派发，不暴露状态写入口，使状态变化只能经 dispatch 推动。
 * @typeParam State store 的状态类型
 * @typeParam Action 受 FluxAction 约束的 action 类型
 */
export type FluxMiddlewareAPI<State, Action extends FluxAction> = {
  /** 读取 store 的当前状态 */
  getState(): State;
  /** 派发入口，签名见 FluxDispatch */
  dispatch: FluxDispatch<Action>;
};

/**
 * flux 的 dispatch 中间件：两层柯里化 (api) => (next) => dispatch，使中间件可在调用 next 前后插入逻辑。
 * @typeParam State store 的状态类型
 * @typeParam Action 受 FluxAction 约束的 action 类型
 * @param api 中间件可访问的 store 视图
 * @returns 接收 next（管道下一环的派发函数）并返回本环派发函数的函数
 * @remarks 与 @slux/store 的状态写入中间件不兼容，是独立的 dispatch 管道；next 是否调用、何时调用由中间件决定
 * @see FluxMiddlewareAPI 中间件拿到的 API；FluxStoreOptions.middleware 中间件的提供处
 */
export type FluxMiddleware<State, Action extends FluxAction> = (
  api: FluxMiddlewareAPI<State, Action>,
) => (next: FluxDispatch<Action>) => FluxDispatch<Action>;

/**
 * 创建 flux store 时的可选项，仅覆盖中间件配置。
 * @typeParam State store 的状态类型
 * @typeParam Action 受 FluxAction 约束的 action 类型
 */
export type FluxStoreOptions<State, Action extends FluxAction> = {
  /** 可选的中间件数组，省略或空数组表示不附加中间件 */
  readonly middleware?: readonly FluxMiddleware<State, Action>[];
};

/**
 * flux store 的公共契约：在 Subscribable<State> 的值读取/订阅能力之外，提供状态读取、初始状态、派发与销毁入口。
 * @typeParam State store 的状态类型
 * @typeParam Action 受 FluxAction 约束的 action 类型
 * @remarks 继承 Subscribable 使 store 可直接作为 @slux/core 的数据源被订阅；销毁后不应再派发或订阅
 * @see createFluxStore 构造本契约的工厂
 */
export type FluxStore<State, Action extends FluxAction> = Subscribable<State> & {
  /** 读取当前状态，反映最近一次归约的结果 */
  getState(): State;
  /** 返回构造 store 时的初始状态 */
  getInitialState(): State;
  /** 派发入口，经 middleware 管道与 reducer 推动状态变化 */
  dispatch: FluxDispatch<Action>;
  /** 释放订阅并终结 store 生命周期；调用后不应再派发或订阅 */
  destroy(): void;
};
