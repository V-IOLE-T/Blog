import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const blogPagePath = path.join(process.cwd(), "src", "pages", "blog", "index.astro");
const folderDataPath = path.join(process.cwd(), "src", "page_data", "BlogFolders.ts");

test("/blog 页面使用 folder 查询参数驱动目录状态", async () => {
  const pageContent = await readFile(blogPagePath, "utf8");

  assert.match(pageContent, /BlogFolders|BLOG_FOLDERS/);
  assert.match(pageContent, /folder=/);
  assert.match(pageContent, /window\.location\.search|URLSearchParams/);
});

test("逻辑文件夹配置包含名称和简介", async () => {
  const folderContent = await readFile(folderDataPath, "utf8");

  assert.match(folderContent, /slug:/);
  assert.match(folderContent, /name:/);
  assert.match(folderContent, /description:/);
});
