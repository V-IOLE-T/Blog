import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { access, readFile } from "node:fs/promises";

const exists = async (targetPath) => {
  try {
    await access(path.join(process.cwd(), targetPath));
    return true;
  } catch {
    return false;
  }
};

test("存在 resume 页面并移除 about 与 categories 页面", async () => {
  assert.equal(await exists("src/pages/resume/index.astro"), true);
  assert.equal(await exists("src/pages/about/index.md"), false);
  assert.equal(await exists("src/pages/categories/[...categories].astro"), false);
});

test("文章详情页和侧边栏不再链接到 categories 路由", async () => {
  const articlePage = await readFile(path.join(process.cwd(), "src", "pages", "article", "[...article].astro"), "utf8");
  const aside = await readFile(path.join(process.cwd(), "src", "components", "Aside", "Aside.astro"), "utf8");

  assert.doesNotMatch(articlePage, /\/categories\//);
  assert.doesNotMatch(articlePage, /post\.data\.categories/);
  assert.doesNotMatch(aside, /getCategories/);
  assert.doesNotMatch(aside, /\/categories\//);
});
