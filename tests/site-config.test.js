import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const configPath = path.join(process.cwd(), "src", "config.ts");

test("站点配置使用新的主页名称并关闭文章打赏码", async () => {
  const configContent = await readFile(configPath, "utf8");

  assert.match(configContent, /Title:\s*'Zheng Han\(OO\)'/);
  assert.match(configContent, /Author:\s*'Zheng Han\(OO\)'/);
  assert.match(configContent, /AliPay:\s*''/);
  assert.match(configContent, /WeChat:\s*''/);
});
