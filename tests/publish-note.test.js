import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import os from "node:os";
import { mkdtemp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

import { publishNote } from "../script/publish-note.js";

const FIXED_NOW = new Date("2026-03-29T12:34:56.000Z");

async function createWorkspace() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "obsidian-publish-"));
  await mkdir(path.join(rootDir, "notes", "posts"), { recursive: true });
  await mkdir(path.join(rootDir, "notes", "assets"), { recursive: true });
  await mkdir(path.join(rootDir, "src", "content", "blog"), { recursive: true });
  await mkdir(path.join(rootDir, "public", "assets"), { recursive: true });
  return rootDir;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

test("发布笔记时补全 frontmatter、写回源笔记并生成 Astro 文章", async () => {
  const rootDir = await createWorkspace();
  const notePath = path.join(rootDir, "notes", "posts", "第一篇文章.md");
  const gitCalls = [];

  await writeFile(
    notePath,
    `---
title: 第一篇文章
tags:
  - Obsidian
---

这是正文。
`,
    "utf8"
  );

  const result = await publishNote({
    rootDir,
    notePath,
    now: FIXED_NOW,
    execGit: async (...args) => {
      gitCalls.push(args);
      return { code: 0, stdout: "", stderr: "" };
    },
  });

  const sourceContent = await readFile(notePath, "utf8");
  const publishedContent = await readFile(result.outputPath, "utf8");

  assert.equal(result.frontmatter.title, "第一篇文章");
  assert.equal(result.frontmatter.categories, "未分类");
  assert.deepEqual(result.frontmatter.tags, ["Obsidian"]);
  assert.equal(result.frontmatter.id, "第一篇文章");
  assert.match(sourceContent, /categories: 未分类/);
  assert.match(sourceContent, /id: 第一篇文章/);
  assert.match(sourceContent, /date: 2026-03-29 12:34:56/);
  assert.match(sourceContent, /updated: 2026-03-29 12:34:56/);
  assert.ok(result.outputPath.endsWith(path.join("src", "content", "blog", "2026", "03", "第一篇文章.md")));
  assert.match(publishedContent, /title: 第一篇文章/);
  assert.match(publishedContent, /categories: 未分类/);
  assert.match(publishedContent, /id: 第一篇文章/);
  assert.doesNotMatch(publishedContent, /draft:/);
  assert.match(publishedContent, /这是正文。/);
  assert.deepEqual(gitCalls, [
    ["add", notePath, result.outputPath],
    ["commit", "-m", "publish: 第一篇文章"],
    ["push"],
  ]);
});

test("发布无标签笔记时会显式写出 tags: []，避免前端组件读到 undefined", async () => {
  const rootDir = await createWorkspace();
  const notePath = path.join(rootDir, "notes", "posts", "无标签文章.md");

  await writeFile(
    notePath,
    `---
title: 无标签文章
categories: 未分类
---

正文。
`,
    "utf8"
  );

  const result = await publishNote({
    rootDir,
    notePath,
    now: FIXED_NOW,
    execGit: async () => ({ code: 0, stdout: "", stderr: "" }),
  });

  const sourceContent = await readFile(notePath, "utf8");
  const publishedContent = await readFile(result.outputPath, "utf8");

  assert.match(sourceContent, /tags: \[\]/);
  assert.match(publishedContent, /tags: \[\]/);
});

test("发布时把 ![[图片]] 转换成站内路径并按内容哈希复制资源", async () => {
  const rootDir = await createWorkspace();
  const notePath = path.join(rootDir, "notes", "posts", "图片文章.md");
  const imageBuffer = Buffer.from("image-binary-content");
  const imageName = "封面 图片.png";
  const imagePath = path.join(rootDir, "notes", "assets", imageName);
  const imageHash = sha256(imageBuffer);
  const expectedRelativeAssetPath = `/assets/uploads/2026/03/${imageHash}.png`;
  const expectedOutputAssetPath = path.join(rootDir, "public", "assets", "uploads", "2026", "03", `${imageHash}.png`);

  await writeFile(imagePath, imageBuffer);
  await writeFile(
    notePath,
    `---
title: 图片文章
cover: "![[${imageName}]]"
---

首图在这里：

![[${imageName}]]

再来一次：

![[${imageName}]]
`,
    "utf8"
  );

  const result = await publishNote({
    rootDir,
    notePath,
    now: FIXED_NOW,
    execGit: async () => ({ code: 0, stdout: "", stderr: "" }),
  });

  const publishedContent = await readFile(result.outputPath, "utf8");
  const assetStat = await stat(expectedOutputAssetPath);

  assert.equal(result.frontmatter.cover, expectedRelativeAssetPath);
  assert.match(publishedContent, new RegExp(`cover: "${expectedRelativeAssetPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  assert.match(publishedContent, new RegExp(`!\\[封面 图片\\]\\(${expectedRelativeAssetPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`));
  assert.equal(assetStat.isFile(), true);
  assert.equal(result.copiedAssets.length, 1);
  assert.deepEqual(result.copiedAssets.map((item) => item.publicPath), [expectedRelativeAssetPath]);
});

test("draft 笔记不会生成发布产物，也不会执行 git 命令", async () => {
  const rootDir = await createWorkspace();
  const notePath = path.join(rootDir, "notes", "posts", "草稿文章.md");
  let gitCalled = false;

  await writeFile(
    notePath,
    `---
title: 草稿文章
draft: true
---

不该发布。
`,
    "utf8"
  );

  await assert.rejects(
    publishNote({
      rootDir,
      notePath,
      now: FIXED_NOW,
      execGit: async () => {
        gitCalled = true;
        return { code: 0, stdout: "", stderr: "" };
      },
    }),
    /draft/
  );

  assert.equal(gitCalled, false);
});

test("notes/assets 中存在重名附件时直接报错，不做猜测", async () => {
  const rootDir = await createWorkspace();
  const notePath = path.join(rootDir, "notes", "posts", "重名图片文章.md");

  await mkdir(path.join(rootDir, "notes", "assets", "a"), { recursive: true });
  await mkdir(path.join(rootDir, "notes", "assets", "b"), { recursive: true });
  await writeFile(path.join(rootDir, "notes", "assets", "a", "重复.png"), "a");
  await writeFile(path.join(rootDir, "notes", "assets", "b", "重复.png"), "b");
  await writeFile(
    notePath,
    `---
title: 重名图片文章
---

![[重复.png]]
`,
    "utf8"
  );

  await assert.rejects(
    publishNote({
      rootDir,
      notePath,
      now: FIXED_NOW,
      execGit: async () => ({ code: 0, stdout: "", stderr: "" }),
    }),
    /重复\.png/
  );
});

test("Obsidian 文章模板使用合法的默认 frontmatter", async () => {
  const templatePath = path.join(process.cwd(), ".obsidian", "templates", "Post Template.md");
  const templateContent = await readFile(templatePath, "utf8");

  assert.equal(
    templateContent.startsWith(`---
title: {{title}}
categories: 未分类
tags: []
id:
date:
updated:
cover:
draft: true
---`),
    true
  );
  assert.doesNotMatch(templateContent, /\{ categories \}/);
  assert.doesNotMatch(templateContent, /\{ tags \}/);
  assert.doesNotMatch(templateContent, /^!\[\[图片\.png\]\]$/m);
});
