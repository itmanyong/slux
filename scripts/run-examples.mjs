#!/usr/bin/env node
/**
 * 一键启动 slux 全部示例。
 *
 * 命名约定（用 pnpm --filter 的模糊匹配把两类包分开）：
 *   @slux/example-*   → 可运行的示例站，dev 端口写死在各自 package.json（9001 起）
 *   @slux/*-example   → `_` 开头的目录里的基础设施包（shell / kit / gallery），只构建
 *
 * 端口清单：examples/_gallery/src/manifest.json（总览 9000，示例 9001+）。
 * 用法：pnpm examples:dev
 *
 * 输出策略：构建日志与 dev 启动日志照常显示；dev 是长驻命令不会自行「运行完」，
 * 因此以「26 个端口全部就绪」作为启动阶段结束的判定点。就绪后停止转发后续日志
 * （静默收集，异常退出时落到临时文件），再统一打印链接清单，总览收在最后一行，
 * 这样链接始终停在终端末尾、不会被日志顶走。
 */

import { spawn, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(path.join(ROOT, "examples", "_gallery", "src", "manifest.json"), "utf8"));

const isWin = process.platform === "win32";
const EXAMPLES_FILTER = "@slux/example-*";
const INFRA_FILTER = "@slux/*-example";
const GALLERY_FILTER = "@slux/gallery-example";

const galleryUrl = `http://localhost:${manifest.gallery.port}/`;
const ports = [manifest.gallery.port, ...manifest.examples.map((e) => e.port)];
const READY_TIMEOUT_MS = 120_000;

/**
 * Windows 下 pnpm 是 .cmd，Node 不能直接 spawn；用 cmd.exe /d /s /c 显式转发，
 * 并保持 shell:false + 参数数组：既避免 Node 24 的 DEP0190 弃用警告，
 * 也不会让 sh 把 filter 里的 `*` 当通配符展开。
 */
function pnpmCall(args) {
  return isWin ? { command: "cmd.exe", args: ["/d", "/s", "/c", "pnpm", ...args] } : { command: "pnpm", args };
}

/* ── 访问链接：启动日志全部输出完后统一打印，总览必须是最后一行 ── */
function printLinks() {
  console.log("\n  slux examples · 访问链接\n");
  console.log(`  共 ${manifest.examples.length} 个示例 + 1 个总览；端口写死在各包 dev 脚本，从 9000 起逐一递加。`);
  console.log("  构建与启动日志已显示完毕；之后日志静默以保持链接在末尾，Ctrl+C 结束全部服务。\n");
  for (const item of manifest.examples) {
    const label = `${item.label}`.padEnd(16);
    console.log(`    ${label} http://localhost:${item.port}/   ${item.group}`);
  }
  console.log("");
  console.log(`  ★ 总览   ${galleryUrl}`);
}

/* ── ① 先构建以 -example 结尾的基础设施包 ───────────
 * shell / kit 是纯源码包，没有 dev 服务，构建即类型检查；
 * gallery 生成静态产物。三者都不靠 `--filter "@slux/example-*"` 启动。
 * 构建日志直接显示在终端。 */
const buildCall = pnpmCall(["--filter", INFRA_FILTER, "run", "build"]);
const build = spawnSync(buildCall.command, buildCall.args, {
  cwd: ROOT,
  stdio: "inherit",
});
if (build.status !== 0) {
  console.error(`[examples:dev] 构建失败（exit ${build.status}），已中止启动。`);
  process.exit(build.status ?? 1);
}

/* ── ② 一条命令并发启动所有示例 + 总览 ─────────────────
 * --parallel 让 pnpm 忽略拓扑与并发上限，长驻 dev 进程同时跑；
 * Ctrl+C 时由 pnpm 统一结束全部子进程。启动日志实时转发到终端，
 * 就绪后停止转发，避免覆盖后面打印的链接清单。 */
const devCall = pnpmCall(["--filter", EXAMPLES_FILTER, "--filter", GALLERY_FILTER, "--parallel", "run", "dev"]);
const dev = spawn(devCall.command, devCall.args, {
  cwd: ROOT,
  stdio: ["inherit", "pipe", "pipe"],
});

let devLog = "";
let quiet = false;
let devExited = false;

/** 启动阶段的日志照常显示；就绪后只收集不显示。 */
function forward(stream) {
  return (chunk) => {
    devLog = `${devLog}${chunk}`.slice(-65536);
    if (!quiet) stream.write(chunk);
  };
}
dev.stdout.setEncoding("utf8");
dev.stderr.setEncoding("utf8");
dev.stdout.on("data", forward(process.stdout));
dev.stderr.on("data", forward(process.stderr));

dev.on("exit", (code, signal) => {
  devExited = true;
  if (code !== 0 && !signal && devLog.trim()) {
    const logPath = path.join(os.tmpdir(), `slux-examples-dev-${process.pid}.log`);
    try {
      writeFileSync(logPath, devLog, "utf8");
      console.error(`\n[examples:dev] dev 服务异常退出（exit ${code}），完整日志：${logPath}`);
    } catch {
      console.error(`\n[examples:dev] dev 服务异常退出（exit ${code}）。`);
    }
  }
  process.exit(code ?? 0);
});

/* ── ③ 等所有端口可连接，视为「启动命令跑完」 ───────────
 * 部分 dev 服务只绑定 IPv6 localhost，因此依次尝试 localhost / 127.0.0.1 / ::1。
 * 超时也照常打印链接，并列出未就绪端口，不能让个别慢服务卡住清单。 */
function probeHost(host, port, timeout = 600) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    let settled = false;
    const done = (ok) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeout);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}

async function probe(port) {
  for (const host of ["localhost", "127.0.0.1", "::1"]) {
    if (await probeHost(host, port)) return true;
    if (devExited) return false;
  }
  return false;
}

async function waitForAllReady() {
  const pending = new Set(ports);
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (pending.size && Date.now() < deadline && !devExited) {
    const checks = await Promise.all([...pending].map(async (port) => [port, await probe(port)]));
    for (const [port, ok] of checks) if (ok) pending.delete(port);
    if (pending.size && !devExited) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  return [...pending];
}

const unready = await waitForAllReady();
if (devExited) process.exit(1);

quiet = true;
if (unready.length) {
  console.log(`\n[examples:dev] 等待 ${Math.round(READY_TIMEOUT_MS / 1000)}s 后仍有端口未就绪：${unready.join(", ")}。`);
}
printLinks();
