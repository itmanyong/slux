import type { Middleware } from "@slux/store";
import { broadcast, type BroadcastMessage, type ConflictResolver } from "../src/index.js";

interface State {
  count: number;
  label: string;
}
const resolve: ConflictResolver<State> = (incoming, current) => ({ count: incoming.count ?? current.count });
const middleware: Middleware<State> = broadcast<State>({ channel: "typecheck", conflictResolution: resolve });
const message: BroadcastMessage<State> = { senderId: "tab", timestamp: 1, state: { count: 2 } };
void middleware;
void message;
// @ts-expect-error 状态字段类型应随泛型约束。
broadcast<State>({ channel: "typecheck", filter: () => ({ count: "wrong" }) });
// @ts-expect-error 不支持未定义的冲突策略。
broadcast<State>({ channel: "typecheck", conflictResolution: "merge" });
