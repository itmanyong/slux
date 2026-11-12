/**
 * @file tab-sync 包的类型契约：跨标签页广播消息、冲突解决策略与广播中间件配置。
 */

export type BroadcastMessage<T> = {
  /** 发送方标识，用于区分消息来源与过滤自身消息。 */
  readonly senderId: string;

  /** 消息时间戳，量纲由写入方决定。 */
  readonly timestamp: number;

  /** 携带的局部状态。 */
  readonly state: Partial<T>;
};

/**
 * 自定义冲突解决函数：结合远端传入状态与本地当前状态，产出实际要应用的局部状态。
 * @param incoming 远端广播携带的局部状态
 * @param current 本标签页当前完整状态
 * @returns 最终要应用的局部状态
 */
export type ConflictResolver<T> = (incoming: Partial<T>, current: T) => Partial<T>;

/**
 * 冲突解决策略："last-write-wins"、"timestamp"，或自定义 ConflictResolver 函数。
 */
export type ConflictResolution<T> = "last-write-wins" | "timestamp" | ConflictResolver<T>;

/**
 * broadcast 中间件的配置对象，除 channel 外均可选。
 */
export type BroadcastOptions<T> = {
  /** 广播通道名。 */
  readonly channel: string;

  /**
   * 状态筛选函数：把完整状态裁剪为要广播的局部状态；未提供时由实现决定默认广播范围。
   */
  readonly filter?: (state: T) => Partial<T>;

  /**
   * 冲突解决策略。
   * @remarks timestamp 策略只与最近已接受的远端时间戳比较，本地更新不推进该值。
   * @see ConflictResolution
   */
  readonly conflictResolution?: ConflictResolution<T>;
};
