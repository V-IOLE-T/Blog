import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readdir, readFile } from "node:fs/promises";

const contentConfigPath = path.join(process.cwd(), "src", "content.config.ts");
const blogContentDir = path.join(process.cwd(), "src", "content", "blog");

const getFrontmatter = (content) => {
  const [, frontmatter = ""] = content.split("---");
  return frontmatter;
};

const collectMarkdownFiles = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return collectMarkdownFiles(entryPath);
      }
      return entry.name.endsWith(".md") ? [entryPath] : [];
    }),
  );

  return files.flat();
};

test("文章 schema 使用 folder 与 summary 而不是 categories", async () => {
  const schemaContent = await readFile(contentConfigPath, "utf8");

  assert.match(schemaContent, /folder:\s*z\.string\(\)/);
  assert.match(schemaContent, /summary:\s*z\.string\(\)\.optional\(\)/);
  assert.doesNotMatch(schemaContent, /categories:\s*z\.string\(\)/);
});

test("现有文章 frontmatter 已迁移到 folder 字段", async () => {
  const files = await collectMarkdownFiles(blogContentDir);

  for (const file of files) {
    const content = await readFile(file, "utf8");
    const frontmatter = getFrontmatter(content);

    assert.match(frontmatter, /^folder:\s+.+$/m, `${path.basename(file)} 缺少 folder`);
    assert.doesNotMatch(frontmatter, /^categories:\s+.+$/m, `${path.basename(file)} 仍包含 categories`);
  }
});
