export const REF_MARKER: unique symbol = Symbol("slux.ref");

export type Ref<T> = {
  current: T;
  readonly [REF_MARKER]: true;
};

export type Snapshot<T> = T extends (...args: never[]) => unknown ? T : T extends object ? { readonly [K in keyof T]: Snapshot<T[K]> } : T;
