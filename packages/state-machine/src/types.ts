/**
 * @file state-machine 包的类型契约：声明快照、守卫、动作、迁移、配置与运行状态机接口，仅含类型。
 * 泛型约定：Context 为上下文类型、Event 为带 type 判别字段的事件联合、State 为字符串字面量状态联合。
 */

import type { Subscribable } from "@slux/core";

/**
 * 状态机在某一时刻的不可变快照，供订阅者与 send 返回值共用。
 * @template Context 上下文数据类型。
 * @template State 字符串字面量状态联合。
 */
export interface MachineSnapshot<Context, State extends string> {
  /** 当前所处状态。 */
  readonly value: State;
  /** 当前上下文数据。 */
  readonly context: Context;
}

/**
 * 迁移守卫函数类型：判断是否允许该次迁移。
 * @param context 触发迁移前的上下文。
 * @param event 触发迁移的事件。
 * @returns true 允许迁移，false 阻止。
 */
export type MachineGuard<Context, Event extends { type: string }> = (context: Context, event: Event) => boolean;
/**
 * 迁移动作函数类型：可返回新上下文，或返回 void 保持不变。
 * @param context 执行动作前的上下文。
 * @param event 触发动作的事件。
 * @returns 新的 Context 表示替换上下文；void 表示沿用原上下文。
 */
export type MachineAction<Context, Event extends { type: string }> = (context: Context, event: Event) => Context | void;

/**
 * 单条迁移的描述，目标状态、守卫与动作均可选，缺省行为由实现方解释。
 * @template Context 上下文数据类型。
 * @template Event 带 type 字段的事件联合。
 * @template State 字符串字面量状态联合。
 */
export interface MachineTransition<Context, Event extends { type: string }, State extends string> {
  /** 目标状态；缺省为自转移。 */
  target?: State;
  /** 迁移守卫；缺省视为不设防。 */
  guard?: MachineGuard<Context, Event>;
  /** 迁移动作，单个或只读数组。 */
  actions?: MachineAction<Context, Event> | readonly MachineAction<Context, Event>[];
}

/**
 * 迁移配置的简写联合：直接给出目标状态（State）或完整迁移描述（MachineTransition）。
 * @template Context 上下文数据类型。
 * @template Event 带 type 字段的事件联合。
 * @template State 字符串字面量状态联合。
 */
export type MachineTransitionConfig<Context, Event extends { type: string }, State extends string> =
  State | MachineTransition<Context, Event, State>;

/**
 * 单个状态的配置：按事件类型索引的迁移表。
 * on 的键经 Extract narrowing 到与该键对应的事件分支，保证事件类型与迁移配置的判别关联。
 * @template Context 上下文数据类型。
 * @template Event 带 type 字段的事件联合。
 * @template State 字符串字面量状态联合。
 */
export interface MachineStateConfig<Context, Event extends { type: string }, State extends string> {
  /**
   * 事件到迁移配置的映射表，可选；值为单条或只读多条配置。
   */
  on?: {
    [Type in Event["type"]]?:
      | MachineTransitionConfig<Context, Extract<Event, { type: Type }>, State>
      | readonly MachineTransitionConfig<Context, Extract<Event, { type: Type }>, State>[];
  };
}

/**
 * 状态机的整体配置：初始状态、初始上下文与各状态配置表。
 * @template Context 上下文数据类型。
 * @template Event 带 type 字段的事件联合。
 * @template State 字符串字面量状态联合。
 */
export interface MachineConfig<Context, Event extends { type: string }, State extends string> {
  /** 初始状态。 */
  initial: State;
  /** 初始上下文数据。 */
  context: Context;
  /** 状态配置表，Record 要求覆盖所有状态。 */
  states: Record<State, MachineStateConfig<Context, Event, State>>;
}

/**
 * 运行状态机的对外接口，继承 Subscribable 以支持订阅状态快照。
 * 由 createMachine 创建，调用 destroy 结束使用。
 * @template Context 上下文数据类型。
 * @template Event 带 type 字段的事件联合。
 * @template State 字符串字面量状态联合。
 * @see MachineSnapshot 订阅与发送返回的快照类型
 */
export interface StateMachine<Context, Event extends { type: string }, State extends string> extends Subscribable<
  MachineSnapshot<Context, State>
> {
  /**
   * 发送一个事件，触发匹配的迁移并返回迁移后的快照。
   * @param event 待发送事件。
   * @returns 事件处理后的快照。
   */
  send(event: Event): MachineSnapshot<Context, State>;
  /**
   * 判断当前是否处于指定状态。
   * @param state 待比较状态。
   * @returns 当前状态等于 state 时返回 true，否则 false。
   */
  matches(state: State): boolean;
  /**
   * 判断某事件在当前状态下是否可触发迁移。
   * @param event 待检查事件。
   * @returns 存在可用迁移时返回 true，否则 false。
   */
  can(event: Event): boolean;
  /** 销毁状态机。 */
  destroy(): void;
}
