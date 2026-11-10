import { act } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach } from "rstack/test";

const cleanups: (() => void)[] = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

export function render(node: ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  let mounted = true;
  const unmount = () => {
    if (!mounted) return;
    mounted = false;
    act(() => root.unmount());
    container.remove();
  };
  cleanups.push(unmount);
  const rerender = (next: ReactNode) => {
    act(() => root.render(next));
  };
  rerender(node);
  return { container, rerender, unmount };
}
