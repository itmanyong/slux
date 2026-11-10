import type { DemoApiId } from "./types.js";

export interface DemoApiGroup {
  id: DemoApiId;
  /** 代码中的入口名，对应左侧目录与卡片标签 */
  name: string;
  /** 中文名称 */
  title: string;
  summary: string;
}

/** 左侧 API 目录的分组顺序与说明。 */
export const apiGroups: readonly DemoApiGroup[] = [
  {
    id: "signal",
    name: "signal",
    title: "信号",
    summary: "可写信号：写入、草稿与订阅",
  },
  {
    id: "computed",
    name: "computed",
    title: "派生计算",
    summary: "惰性求值、缓存与依赖追踪",
  },
  {
    id: "effect",
    name: "effect",
    title: "副作用",
    summary: "同步执行、清理与释放",
  },
  {
    id: "batch",
    name: "batch",
    title: "批处理",
    summary: "合并通知与统一刷新",
  },
  {
    id: "scope",
    name: "scope",
    title: "作用域",
    summary: "覆盖读取、fork 与快照序列化",
  },
];

/** 被示例覆盖的公开 API，用于统计总览。 */
export const publicApis: readonly string[] = ["signal", "computed", "effect", "batch", "createScope", "runInScope", "serializeScope"];
