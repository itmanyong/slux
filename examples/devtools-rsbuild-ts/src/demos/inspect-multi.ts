import { createStore } from "@slux/store";
import { devtools, inspect } from "@slux/devtools";
import type { InspectEvent } from "@slux/devtools";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;
type Log = (message: string, tone?: LogTone) => void;
type CartState = { items: number; total: number };
type ProfileState = { name: string };

const MAX_EVENTS = 40;

export function createInspectMultiDemo(log: Log): DemoInstance {
  const events: string[] = [];
  const record = (event: InspectEvent): void => {
    const text = `${event.type} · ${event.storeName}${event.action === undefined ? "" : ` · ${event.action}`}`;
    events.push(text);
    if (events.length > MAX_EVENTS) events.shift();
    log(text, "notify");
  };

  const unsubscribe = inspect(record);
  const cart = createStore<CartState>(() => ({ items: 0, total: 0 }), {
    middleware: [devtools<CartState>({ name: "cart" })],
  });
  const profile = createStore<ProfileState>(() => ({ name: "ada" }), {
    middleware: [devtools<ProfileState>({ name: "profile" })],
  });

  return {
    readouts: [
      {
        kind: "metric",
        label: "cart.items",
        emphasis: true,
        read: () => String(cart.getState().items),
      },
      {
        kind: "metric",
        label: "cart.total",
        read: () => String(cart.getState().total),
      },
      {
        kind: "text",
        label: "profile.name",
        read: () => profile.getState().name,
      },
      { kind: "list", label: "inspect 事件流", read: () => events.slice(-6) },
    ],
    actions: [
      {
        id: "add-item",
        label: "cart + 1 件",
        primary: true,
        run: () => {
          cart.setState((state) => ({
            items: state.items + 1,
            total: state.total + 10,
          }));
        },
      },
      {
        id: "rename",
        label: "改名",
        input: { kind: "text", placeholder: "新的 profile.name", value: "" },
        run: (value) => {
          const name = value.trim();
          if (name === "") {
            log("输入为空，跳过改名", "error");
            return;
          }
          profile.setState({ name });
        },
      },
    ],
    dispose: () => {
      cart.destroy();
      profile.destroy();
      unsubscribe();
    },
  };
}
