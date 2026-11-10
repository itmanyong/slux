import { useEffect, useState } from "react";
import Markdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";

const sourceBase = "https://github.com/itmanyong/slux/blob/main/";
const rawBase = "https://raw.githubusercontent.com/itmanyong/slux/main/";

type RemoteContent = { status: "loading" } | { status: "error" } | { status: "ready"; markdown: string };

export function RemoteMarkdown({ path }: { path: string }) {
  const [content, setContent] = useState<RemoteContent>({ status: "loading" });
  const sourceUrl = new URL(path, sourceBase);
  const rawUrl = new URL(path, rawBase);

  useEffect(() => {
    const controller = new AbortController();
    setContent({ status: "loading" });
    fetch(rawUrl, { signal: controller.signal, cache: "no-cache" })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then((markdown) => setContent({ status: "ready", markdown }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error(`无法加载 ${rawUrl}`, error);
          setContent({ status: "error" });
        }
      });
    return () => controller.abort();
  }, [rawUrl.href]);

  if (content.status === "loading") return <p className="remote-markdown-status">正在加载更新日志…</p>;
  if (content.status === "error") {
    return (
      <p className="remote-markdown-status">
        更新日志加载失败。请稍后重试，或
        <a href={sourceUrl.href} target="_blank" rel="noopener noreferrer">
          在 GitHub 查看原文
        </a>
        。
      </p>
    );
  }

  return (
    <div className="remote-markdown">
      <Markdown
        skipHtml
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const target = href ? defaultUrlTransform(new URL(href, sourceUrl).href) : undefined;
            return (
              <a href={target} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
          img: ({ src, alt }) => {
            const target = src ? defaultUrlTransform(new URL(src, rawUrl).href) : undefined;
            return <img src={target} alt={alt ?? ""} />;
          },
        }}
      >
        {content.markdown}
      </Markdown>
    </div>
  );
}
