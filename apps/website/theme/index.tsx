import "./index.css";

import { useEffect, useRef, useState } from "react";
import { usePage } from "@rspress/core/runtime";
import { Layout as OriginalLayout, Link } from "@rspress/core/theme-original";

export * from "@rspress/core/theme-original";
export { ExampleFrame } from "./ExampleFrame";
export { RemoteMarkdown } from "./RemoteMarkdown";

function PackageLines() {
  const { page } = usePage();
  const match = /^\/packages\/(?!(?:auto-import|overview-[^/]+)(?:\/|$))([^/]+)(?:\/(api|types|readme|demo|changelog))?\/?$/.exec(
    page.routePath,
  );
  const originalRef = useRef<HTMLElement>(null);
  const [floating, setFloating] = useState(false);
  const [floatingPosition, setFloatingPosition] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (!match || !originalRef.current) return;
    const update = () => {
      const original = originalRef.current;
      if (!original) return;
      const rect = original.getBoundingClientRect();
      const navBottom = document.querySelector(".rp-nav")?.getBoundingClientRect().bottom ?? 0;
      setFloating(rect.top <= navBottom);
      setFloatingPosition((previous) => {
        const next = { left: Math.max(12, rect.left - 12), top: navBottom };
        return previous.left === next.left && previous.top === next.top ? previous : next;
      });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [page.routePath]);

  useEffect(() => {
    if (!match || !match[2]) return;
    const sidebar = document.querySelector(".rp-doc-layout__sidebar");
    if (!sidebar) return;
    const guidePath = `/packages/${match[1]}/`;
    const update = () => {
      sidebar.querySelectorAll<HTMLAnchorElement>("a.rp-sidebar-item").forEach((link) => {
        const selected = new URL(link.href).pathname.endsWith(guidePath);
        link.classList.toggle("package-sidebar-selected", selected);
        if (selected) link.setAttribute("aria-current", "location");
      });
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(sidebar, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      sidebar.querySelectorAll(".package-sidebar-selected").forEach((link) => {
        link.classList.remove("package-sidebar-selected");
        link.removeAttribute("aria-current");
      });
    };
  }, [page.routePath]);

  if (!match) return null;

  const name = match[1];
  const activeLine = match[2] ?? "guide";
  const lines = [
    { id: "guide", label: "使用指南", href: `/packages/${name}/` },
    { id: "api", label: "API 定义", href: `/packages/${name}/api` },
    { id: "types", label: "类型定义", href: `/packages/${name}/types` },
    { id: "readme", label: "README 原文", href: `/packages/${name}/readme` },
    { id: "demo", label: "演示示例", href: `/packages/${name}/demo` },
    { id: "changelog", label: "更新日志", href: `/packages/${name}/changelog` },
  ];

  return (
    <>
      <nav ref={originalRef} className={floating ? "doc-lines doc-lines-placeholder" : "doc-lines"} aria-label="文档线路">
        {lines.map((line) => (
          <Link
            key={line.id}
            className={activeLine === line.id ? "active" : ""}
            aria-current={activeLine === line.id ? "page" : undefined}
            href={line.href}
          >
            {line.label}
          </Link>
        ))}
      </nav>
      {floating && (
        <nav className="doc-lines doc-lines-floating" aria-label="悬浮文档线路" style={floatingPosition}>
          {lines.map((line) => (
            <Link
              key={line.id}
              className={activeLine === line.id ? "active" : ""}
              aria-current={activeLine === line.id ? "page" : undefined}
              href={line.href}
            >
              {line.label}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}

export function Layout() {
  return <OriginalLayout beforeDocContent={<PackageLines />} />;
}
