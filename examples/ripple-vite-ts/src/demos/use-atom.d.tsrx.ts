import type { Component } from "ripple";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

/**
 * `use-atom.tsrx` 由 `@ripple-ts/vite-plugin` 编译，tsc 不认识 `.tsrx` 语法。
 * 这里以 `allowArbitraryExtensions` 的伴生声明文件补上它的对外类型。
 */
export declare const UseAtomDemo: Component<{ log: Log }>;
