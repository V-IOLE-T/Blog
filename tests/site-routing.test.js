import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const configPath = path.join(process.cwd(), "src", "config.ts");

test("导航包含文章目录和简历入口且不再包含关于入口", async () => {
  const configContent = await readFile(configPath, "utf8");

  assert.match(configContent, /text:\s*'文章目录'/);
  assert.match(configContent, /link:\s*'\/blog'/);
  assert.match(configContent, /text:\s*'简历'/);
  assert.match(configContent, /link:\s*'\/resume'/);
  assert.doesNotMatch(configContent, /text:\s*'关于'/);
});
