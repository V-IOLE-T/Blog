import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const indexPagePath = path.join(process.cwd(), "src", "pages", "index.astro");
const headerPath = path.join(process.cwd(), "src", "components", "MainHeader", "MainHeader.astro");

test("首页使用独立 index 页面承载个人介绍", async () => {
  const indexPage = await readFile(indexPagePath, "utf8");

  assert.match(indexPage, /查看文章目录/);
  assert.match(indexPage, /CV\s*\/\s*个人简历/);
  assert.match(indexPage, /个人主页|自我介绍|技术方向/);
});

test("主横幅包含首页 hero 所需按钮", async () => {
  const headerContent = await readFile(headerPath, "utf8");

  assert.match(headerContent, /查看文章目录/);
  assert.match(headerContent, /CV\s*\/\s*个人简历/);
});
