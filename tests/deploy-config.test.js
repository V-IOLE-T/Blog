import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const astroConfigPath = path.join(process.cwd(), "astro.config.mjs");
const packageJsonPath = path.join(process.cwd(), "package.json");

test("Vercel 部署配置避免重复压缩并锁定 pnpm 版本", async () => {
  const [astroConfigContent, packageJsonContent] = await Promise.all([
    readFile(astroConfigPath, "utf8"),
    readFile(packageJsonPath, "utf8"),
  ]);

  assert.doesNotMatch(astroConfigContent, /@playform\/compress/);
  assert.doesNotMatch(astroConfigContent, /astro-compressor/);
  assert.doesNotMatch(astroConfigContent, /\bCompress\s*\(/);
  assert.doesNotMatch(astroConfigContent, /\bCompressor\s*\(/);
  assert.match(packageJsonContent, /"packageManager"\s*:\s*"pnpm@10\.33\.0"/);
});
