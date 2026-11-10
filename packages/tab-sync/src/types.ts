export type BroadcastMessage<T> = {
  readonly senderId: string;

  readonly timestamp: number;

  readonly state: Partial<T>;
};

export type ConflictResolver<T> = (incoming: Partial<T>, current: T) => Partial<T>;

export type ConflictResolution<T> = "last-write-wins" | "timestamp" | ConflictResolver<T>;

export type BroadcastOptions<T> = {
  readonly channel: string;

  readonly filter?: (state: T) => Partial<T>;

  /** timestamp 只与最近已接受的远端时间戳比较；本地更新不推进该值。 */
  readonly conflictResolution?: ConflictResolution<T>;
};
