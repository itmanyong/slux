import { useContext, useEffect, useRef, useState } from "react";
import { ThemeContext } from "@rspress/core/runtime";

const THEME_CHANGED = "THEME_CHANGED";
const THEME_REQUEST = "slux-example-theme-request";

export function ExampleFrame({ src, title, sourcePath }: { src: string; title: string; sourcePath: string }) {
  const { theme, setTheme } = useContext(ThemeContext);
  const [initialSrc, setInitialSrc] = useState<string>();
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const scheme = getComputedStyle(document.documentElement).colorScheme;
      setInitialSrc((previous) => previous ?? `${src}?theme=${scheme === "dark" ? "dark" : "light"}`);
    });
    return () => cancelAnimationFrame(id);
  }, [src]);

  useEffect(() => {
    frame.current?.contentWindow?.postMessage({ type: THEME_CHANGED, payload: { theme } }, "*");
  }, [theme, initialSrc]);

  useEffect(() => {
    const onMessage = (event: MessageEvent): void => {
      if (event.source !== frame.current?.contentWindow) return;
      const data: unknown = event.data;
      if (typeof data !== "object" || data === null) return;
      const message = data as { type?: unknown; payload?: { theme?: unknown } };
      if (message.type === THEME_REQUEST) {
        frame.current?.contentWindow?.postMessage({ type: THEME_CHANGED, payload: { theme } }, "*");
      } else if (
        message.type === THEME_CHANGED &&
        (message.payload?.theme === "light" || message.payload?.theme === "dark") &&
        message.payload.theme !== theme
      ) {
        setTheme?.(message.payload.theme);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [theme, setTheme]);

  const themedLink = `${src}${src.includes("?") ? "&" : "?"}theme=${theme === "dark" ? "dark" : "light"}`;

  return (
    <>
      <div className="example-actions">
        <a
          className="example-action"
          href={`https://github.com/itmanyong/slux/tree/main/${sourcePath}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          在Github中打开
        </a>
        <a className="example-action example-action--primary" href={themedLink} target="_blank" rel="noopener noreferrer">
          在新标签页打开
        </a>
      </div>
      <iframe
        ref={frame}
        className="package-demo-frame"
        title={title}
        src={initialSrc}
        loading="lazy"
        onLoad={() => frame.current?.contentWindow?.postMessage({ type: THEME_CHANGED, payload: { theme } }, "*")}
      />
    </>
  );
}
