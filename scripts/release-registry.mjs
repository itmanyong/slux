import { createHash } from "node:crypto";

export async function getPublishedPackage(name, version, registry = "https://registry.npmjs.org") {
  const response = await fetch(`${registry}/${encodeURIComponent(name)}/${version}`, { signal: AbortSignal.timeout(30_000) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`查询 ${name}@${version} 失败：HTTP ${response.status}`);
  const manifest = await response.json();
  if (manifest.name !== name || manifest.version !== version || !manifest.dist?.tarball || (!manifest.dist.integrity && !manifest.dist.shasum)) {
    throw new Error(`${name}@${version} 的 registry 元数据不完整或不匹配`);
  }
  return manifest;
}

export function verifyPublishedTarball(data, manifest) {
  const { integrity, shasum } = manifest.dist;
  if (integrity) {
    const digests = integrity
      .split(/\s+/)
      .map((part) => part.match(/^(sha(?:512|384|256|1))-([^?]+)(?:\?.*)?$/))
      .filter(Boolean);
    const strongest = ["sha512", "sha384", "sha256", "sha1"].find((algorithm) => digests.some((digest) => digest[1] === algorithm));
    if (
      !strongest ||
      !digests.some(([, algorithm, digest]) => algorithm === strongest && createHash(algorithm).update(data).digest("base64") === digest)
    ) {
      throw new Error(`${manifest.name}@${manifest.version} 的 tarball integrity 校验失败`);
    }
  } else if (createHash("sha1").update(data).digest("hex") !== shasum) {
    throw new Error(`${manifest.name}@${manifest.version} 的 tarball shasum 校验失败`);
  }
}

export async function downloadPublishedTarball(manifest) {
  const response = await fetch(manifest.dist.tarball, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`下载 ${manifest.name}@${manifest.version} 失败：HTTP ${response.status}`);
  const data = Buffer.from(await response.arrayBuffer());
  verifyPublishedTarball(data, manifest);
  return data;
}

export function describeTarball(name, version, filename, data) {
  return {
    name,
    version,
    filename,
    bytes: data.length,
    sha256: createHash("sha256").update(data).digest("hex"),
    integrity: `sha512-${createHash("sha512").update(data).digest("base64")}`,
  };
}
