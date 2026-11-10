import { useContext, useEffect, useRef, useState } from "react";
import { ThemeContext } from "@rspress/core/runtime";

const THEME_CHANGED = "THEME_CHANGED";
const THEME_REQUEST = "slux-example-theme-request";
const CONTENT_LOADED = "CONTENT_LOADED";

interface ExampleFrameProps {
  src: string;
  title: string;
  sourcePath: string;
  packageName: string;
}

function withTheme(src: string, theme: string): string {
  const hashIndex = src.indexOf("#");
  const hash = hashIndex < 0 ? "" : src.slice(hashIndex);
  const [path, query] = (hashIndex < 0 ? src : src.slice(0, hashIndex)).split("?");
  const params = new URLSearchParams(query);
  params.set("theme", theme === "dark" ? "dark" : "light");
  return `${path}?${params}${hash}`;
}

export function ExampleFrame(props: ExampleFrameProps) {
  // 切换地址时替换整个加载会话，旧 iframe 的窗口不能完成新页面的加载。
  return <ExampleFrameSession key={`${props.packageName}:${props.src}`} {...props} />;
}

function ExampleFrameSession({ src, title, sourcePath, packageName }: ExampleFrameProps) {
  const { theme, setTheme } = useContext(ThemeContext);
  const [initialUrl, setInitialUrl] = useState<URL>();
  const [loading, setLoading] = useState(true);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const scheme = getComputedStyle(document.documentElement).colorScheme;
      setInitialUrl(new URL(withTheme(src, scheme), window.location.href));
    });
    return () => cancelAnimationFrame(id);
  }, [src]);

  useEffect(() => {
    if (initialUrl) frame.current?.contentWindow?.postMessage({ type: THEME_CHANGED, payload: { theme } }, initialUrl.origin);
  }, [theme, initialUrl]);

  useEffect(() => {
    if (!initialUrl) return;
    const onMessage = (event: MessageEvent): void => {
      if (event.source !== frame.current?.contentWindow || event.origin !== initialUrl.origin) return;
      const data: unknown = event.data;
      if (typeof data !== "object" || data === null) return;
      const message = data as { type?: unknown; payload?: unknown };
      if (message.type === THEME_REQUEST) {
        frame.current?.contentWindow?.postMessage({ type: THEME_CHANGED, payload: { theme } }, initialUrl.origin);
        return;
      }
      if (typeof message.payload !== "object" || message.payload === null) return;
      const payload = message.payload as { theme?: unknown; package?: unknown };
      if (message.type === CONTENT_LOADED && (payload.package === `@slux/${packageName}` || payload.package === `/${packageName}`)) {
        setLoading(false);
      } else if (message.type === THEME_CHANGED && (payload.theme === "light" || payload.theme === "dark") && payload.theme !== theme) {
        setTheme?.(payload.theme);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [theme, setTheme, initialUrl, packageName]);

  const themedLink = withTheme(src, theme);

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
      <div className="package-demo-container" aria-busy={loading}>
        {initialUrl && (
          <iframe
            ref={frame}
            className="package-demo-frame"
            title={title}
            src={initialUrl.href}
            loading="lazy"
            onLoad={() => {
              setLoading(false);
              frame.current?.contentWindow?.postMessage({ type: THEME_CHANGED, payload: { theme } }, initialUrl.origin);
            }}
          />
        )}
        {loading && (
          <div className="package-demo-loading" role="status" aria-live="polite">
            <span className="package-demo-spinner" aria-hidden="true" />
            <span>正在加载示例…</span>
          </div>
        )}
      </div>
    </>
  );
}
