import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { describeTarball, downloadPublishedTarball, getPublishedPackage, verifyPublishedTarball } from "./release-registry.mjs";
import { publishPackage } from "./release-publish.mjs";

test("registry 查询只把404当未发布，复用真实下载字节并跳过重复发布", async () => {
  const data = Buffer.from("published-tarball-fixture");
  const directory = mkdtempSync(resolve(tmpdir(), "slux-release-registry-"));
  let registry;
  const manifest = { name: "@slux/core", version: "0.2.0", dist: { integrity: `sha512-${createHash("sha512").update(data).digest("base64")}` } };
  const server = createServer((request, response) => {
    if (request.url === "/tarball") {
      response.end(data);
      return;
    }
    if (request.url.endsWith("/0.2.1")) {
      response.writeHead(404).end();
      return;
    }
    if (request.url.endsWith("/0.2.2")) {
      response.writeHead(503).end();
      return;
    }
    if (request.url.endsWith("/0.2.3")) {
      response.end(JSON.stringify({ ...manifest, version: "wrong" }));
      return;
    }
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ ...manifest, dist: { ...manifest.dist, tarball: `${registry}/tarball` } }));
  });
  await new Promise((resolveListening) => server.listen(0, "127.0.0.1", resolveListening));
  registry = `http://127.0.0.1:${server.address().port}`;
  try {
    const published = await getPublishedPackage("@slux/core", "0.2.0", registry);
    assert.deepEqual(await downloadPublishedTarball(published), data);
    assert.equal(await getPublishedPackage("@slux/core", "0.2.1", registry), null);
    await assert.rejects(getPublishedPackage("@slux/core", "0.2.2", registry), /HTTP 503/);
    await assert.rejects(getPublishedPackage("@slux/core", "0.2.3", registry), /不完整或不匹配/);
    writeFileSync(resolve(directory, "slux-core-0.2.0.tgz"), data);
    assert.equal(await publishPackage(directory, "@slux/core", "0.2.0", registry), "skipped");
    assert.equal(await publishPackage(directory, "@slux/core", "0.2.0", registry), "skipped");
    writeFileSync(resolve(directory, "slux-core-0.2.0.tgz"), "different build");
    await assert.rejects(publishPackage(directory, "@slux/core", "0.2.0", registry), /integrity 校验失败/);
    const asset = describeTarball("@slux/core", "0.2.0", "slux-core-0.2.0.tgz", data);
    assert.equal(asset.sha256, createHash("sha256").update(data).digest("hex"));
    assert.equal(asset.integrity, manifest.dist.integrity);
    assert.equal(asset.bytes, data.length);
    assert.throws(() => verifyPublishedTarball(Buffer.from("corrupt"), manifest), /integrity 校验失败/);
    const sha256 = `sha256-${createHash("sha256").update(data).digest("base64")}`;
    assert.throws(() => verifyPublishedTarball(data, { ...manifest, dist: { integrity: `${sha256} sha512-invalid` } }), /integrity 校验失败/);
    verifyPublishedTarball(data, { ...manifest, dist: { shasum: createHash("sha1").update(data).digest("hex") } });
    assert.throws(() => verifyPublishedTarball(data, { ...manifest, dist: { shasum: "incorrect" } }), /shasum 校验失败/);
  } finally {
    await new Promise((resolveClosed) => server.close(resolveClosed));
    rmSync(directory, { recursive: true, force: true });
  }
});
