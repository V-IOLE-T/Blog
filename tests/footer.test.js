import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const footerPath = path.join(process.cwd(), "src", "components", "Footer", "Footer.astro");
const initPath = path.join(process.cwd(), "src", "scripts", "Init.ts");

test("页脚仅保留作者名、Astro、Sitemap 与 RSS", async () => {
  const [footerContent, initContent] = await Promise.all([
    readFile(footerPath, "utf8"),
    readFile(initPath, "utf8"),
  ]);

  assert.match(footerContent, /Zheng Han（OO）/);
  assert.match(footerContent, /https:\/\/astro\.build\//);
  assert.match(footerContent, /\/sitemap-index\.xml/);
  assert.match(footerContent, /\/rss\.xml/);

  assert.doesNotMatch(footerContent, /稳定运行/);
  assert.doesNotMatch(footerContent, /HanAnalytics/);
  assert.doesNotMatch(footerContent, /vhAstro-Theme/);
  assert.doesNotMatch(footerContent, /beian\.miit\.gov\.cn/);
  assert.doesNotMatch(footerContent, /web_time/);
  assert.doesNotMatch(initContent, /@\/scripts\/Footer/);
  assert.doesNotMatch(initContent, /initWebSiteTime/);
});
