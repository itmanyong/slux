import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { expect, it } from "rstack/test";
import { atom, derived } from "@slux/atom";
import { createStore } from "@slux/store";
import { observable } from "@slux/proxy";
import { useAtomValue } from "../src/atom.js";
import { useStore } from "../src/store.js";
import { useSnapshot } from "../src/proxy.js";

it("三个子入口以相同数据 hydration，并继续响应客户端更新", async () => {
  function createState() {
    const count = atom(2);
    return {
      count,
      double: derived((get) => get(count) * 2),
      store: createStore(() => ({ count: 3 })),
      proxy: observable({ count: 5 }),
    };
  }
  function App({ state }: { state: ReturnType<typeof createState> }) {
    const a = useAtomValue(state.double);
    const s = useStore(state.store, (value) => ({ count: value.count }));
    const p = useSnapshot(state.proxy);
    return <span>{`${a}:${s.count}:${p.count}`}</span>;
  }
  const server = createState();
  const client = createState();
  const container = document.createElement("div");
  container.innerHTML = renderToString(<App state={server} />);
  expect(container.textContent).toBe("4:3:5");
  document.body.append(container);
  const errors: unknown[] = [];
  let root: ReturnType<typeof hydrateRoot> | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(container, <App state={client} />, {
        onRecoverableError: (error) => {
          errors.push(error);
        },
      });
    });
    expect(errors).toEqual([]);
    expect(container.textContent).toBe("4:3:5");
    act(() => {
      client.count.set(10);
      client.store.setState({ count: 20 });
      client.proxy.count = 30;
    });
    expect(container.textContent).toBe("20:20:30");
    expect(server.count.get()).toBe(2);
    expect(server.store.getState().count).toBe(3);
    expect(server.proxy.count).toBe(5);
  } finally {
    act(() => root?.unmount());
    container.remove();
    server.store.destroy();
    client.store.destroy();
  }
});
