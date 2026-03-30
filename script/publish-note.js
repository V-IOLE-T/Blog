import path from "node:path";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";

const FRONTMATTER_BOUNDARY = "---";
const FRONTMATTER_ORDER = [
  "title",
  "folder",
  "summary",
  "tags",
  "id",
  "date",
  "updated",
  "cover",
  "draft",
];

class PublishError extends Error {}

function splitFrontmatter(content) {
  if (!content.startsWith(`${FRONTMATTER_BOUNDARY}\n`)) {
    return { data: {}, body: content };
  }

  const closingIndex = content.indexOf(`\n${FRONTMATTER_BOUNDARY}\n`, FRONTMATTER_BOUNDARY.length + 1);
  if (closingIndex === -1) {
    throw new PublishError("Frontmatter 结束分隔符缺失。");
  }

  const rawFrontmatter = content.slice(FRONTMATTER_BOUNDARY.length + 1, closingIndex);
  const body = content.slice(closingIndex + `\n${FRONTMATTER_BOUNDARY}\n`.length);
  return { data: parseFrontmatter(rawFrontmatter), body };
}

function parseFrontmatter(rawFrontmatter) {
  const data = {};
  const lines = rawFrontmatter.split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) {
      continue;
    }

    const inlineMatch = line.match(/^([A-Za-z0-9_-]+):(?:\s+(.*))?$/);
    if (!inlineMatch) {
      throw new PublishError(`无法解析 frontmatter 行：${line}`);
    }

    const [, key, rawValue = ""] = inlineMatch;
    if (!rawValue) {
      const items = [];
      let cursor = index + 1;
      while (cursor < lines.length && /^\s*-\s+/.test(lines[cursor])) {
        items.push(lines[cursor].replace(/^\s*-\s+/, ""));
        cursor += 1;
      }
      if (items.length > 0) {
        data[key] = items.map(parseScalarValue);
        index = cursor - 1;
        continue;
      }
      data[key] = "";
      continue;
    }

    data[key] = parseScalarValue(rawValue);
  }

  return data;
}

function parseScalarValue(rawValue) {
  const value = rawValue.trim();

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    if (!inner) {
      return [];
    }
    return inner
      .split(",")
      .map((item) => parseScalarValue(item.trim()))
      .filter((item) => item !== "");
  }

  return value;
}

function formatFrontmatter(data, { includeDraft }) {
  const lines = [FRONTMATTER_BOUNDARY];

  for (const key of FRONTMATTER_ORDER) {
    if (key === "draft" && !includeDraft) {
      continue;
    }

    if (!(key in data)) {
      continue;
    }

    const value = data[key];
    if (value === undefined || value === null || value === "") {
      continue;
    }

    if (key === "tags") {
      if (!Array.isArray(value)) {
        continue;
      }
      if (value.length === 0) {
        lines.push("tags: []");
        continue;
      }
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - ${item}`);
      }
      continue;
    }

    if (typeof value === "boolean") {
      lines.push(`${key}: ${value ? "true" : "false"}`);
      continue;
    }

    if (shouldQuoteValue(value)) {
      lines.push(`${key}: "${escapeQuotedString(String(value))}"`);
      continue;
    }

    lines.push(`${key}: ${value}`);
  }

  lines.push(FRONTMATTER_BOUNDARY, "");
  return lines.join("\n");
}

function shouldQuoteValue(value) {
  return /[\[\]!#]|^\s|\s$/.test(String(value)) || String(value).startsWith("/") || String(value).includes("://");
}

function escapeQuotedString(value) {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function formatDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function createStableId(input) {
  const normalized = input
    .normalize("NFKC")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{Letter}\p{Number}\u4e00-\u9fff-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (normalized) {
    return normalized;
  }

  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}

function getWikiEmbedTarget(value) {
  const match = String(value).trim().match(/^!\[\[([^|\]]+)\]\]$/);
  return match ? match[1].trim() : null;
}

function createMarkdownImage(assetName, publicPath) {
  const alt = path.parse(assetName).name;
  return `![${alt}](${publicPath})`;
}

async function listFilesRecursively(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursively(fullPath)));
      continue;
    }
    files.push(fullPath);
  }

  return files;
}

async function buildAssetIndex(assetsDir) {
  const assetFiles = await listFilesRecursively(assetsDir);
  const index = new Map();

  for (const assetPath of assetFiles) {
    const baseName = path.basename(assetPath);
    if (!index.has(baseName)) {
      index.set(baseName, []);
    }
    index.get(baseName).push(assetPath);
  }

  for (const [baseName, matches] of index.entries()) {
    if (matches.length > 1) {
      throw new PublishError(`notes/assets 中存在重名附件：${baseName}`);
    }
  }

  return new Map([...index.entries()].map(([baseName, [assetPath]]) => [baseName, assetPath]));
}

async function ensureAssetCopied({ assetName, assetIndex, outputAssetsDir, publicDir, copiedAssets }) {
  if (copiedAssets.has(assetName)) {
    return copiedAssets.get(assetName);
  }

  const assetPath = assetIndex.get(assetName);
  if (!assetPath) {
    throw new PublishError(`未在 notes/assets 中找到附件：${assetName}`);
  }

  const assetBuffer = await readFile(assetPath);
  const hash = createHash("sha256").update(assetBuffer).digest("hex");
  const extension = path.extname(assetPath).toLowerCase();
  const publicPath = path.posix.join("/", "assets", "uploads", outputAssetsDir.year, outputAssetsDir.month, `${hash}${extension}`);
  const destinationPath = path.join(publicDir, "assets", "uploads", outputAssetsDir.year, outputAssetsDir.month, `${hash}${extension}`);

  await mkdir(path.dirname(destinationPath), { recursive: true });
  try {
    await stat(destinationPath);
  } catch {
    await copyFile(assetPath, destinationPath);
  }

  const record = {
    assetName,
    sourcePath: assetPath,
    destinationPath,
    publicPath,
  };
  copiedAssets.set(assetName, record);
  return record;
}

async function transformBody(body, context) {
  const wikiEmbedPattern = /!\[\[([^|\]]+)\]\]/g;
  let result = "";
  let lastIndex = 0;

  for (const match of body.matchAll(wikiEmbedPattern)) {
    result += body.slice(lastIndex, match.index);
    const assetName = match[1].trim();
    const asset = await ensureAssetCopied({ assetName, ...context });
    result += createMarkdownImage(assetName, asset.publicPath);
    lastIndex = match.index + match[0].length;
  }

  result += body.slice(lastIndex);
  return result;
}

function normalizeFrontmatter(frontmatter, notePath, now) {
  const title = String(frontmatter.title || path.parse(notePath).name).trim();
  const tags = Array.isArray(frontmatter.tags)
    ? frontmatter.tags.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const folderSource = Array.isArray(frontmatter.folder)
    ? frontmatter.folder.find((item) => String(item).trim())
    : frontmatter.folder;
  const folder = String(folderSource || "notes").trim() || "notes";
  const summary = typeof frontmatter.summary === "string" ? frontmatter.summary.trim() : "";
  const id = String(frontmatter.id || createStableId(title)).trim();
  const date = String(frontmatter.date || formatDate(now)).trim();
  const updated = formatDate(now);

  return {
    ...frontmatter,
    title,
    folder,
    summary,
    tags,
    id,
    date,
    updated,
  };
}

async function runGitCommand(cwd, args) {
  return new Promise((resolve) => {
    const child = spawn("git", args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

async function execGitOrThrow(cwd, execGit, ...args) {
  const result = await execGit(...args);
  if (result.code !== 0) {
    throw new PublishError(`git ${args.join(" ")} 执行失败：${result.stderr || result.stdout}`);
  }
  return result;
}

export async function publishNote({
  rootDir = process.cwd(),
  notePath,
  now = new Date(),
  execGit = (...args) => runGitCommand(rootDir, args),
} = {}) {
  if (!notePath) {
    throw new PublishError("请提供要发布的笔记路径。");
  }

  const absoluteNotePath = path.isAbsolute(notePath) ? notePath : path.join(rootDir, notePath);
  const noteContent = await readFile(absoluteNotePath, "utf8");
  const { data, body } = splitFrontmatter(noteContent);

  if (data.draft === true) {
    throw new PublishError("draft 笔记不能直接发布。");
  }

  const normalizedFrontmatter = normalizeFrontmatter(data, absoluteNotePath, now);
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const outputAssetsDir = { year, month };
  const assetIndex = await buildAssetIndex(path.join(rootDir, "notes", "assets"));
  const copiedAssets = new Map();
  const publicDir = path.join(rootDir, "public");
  const publishedBody = await transformBody(body, {
    assetIndex,
    outputAssetsDir,
    publicDir,
    copiedAssets,
  });

  const coverAssetName = getWikiEmbedTarget(normalizedFrontmatter.cover);
  let publishedCover = typeof normalizedFrontmatter.cover === "string" ? normalizedFrontmatter.cover : undefined;
  if (coverAssetName) {
    const asset = await ensureAssetCopied({
      assetName: coverAssetName,
      assetIndex,
      outputAssetsDir,
      publicDir,
      copiedAssets,
    });
    publishedCover = asset.publicPath;
  }

  const sourceFrontmatter = {
    title: normalizedFrontmatter.title,
    folder: normalizedFrontmatter.folder,
    summary: normalizedFrontmatter.summary,
    tags: normalizedFrontmatter.tags,
    id: normalizedFrontmatter.id,
    date: normalizedFrontmatter.date,
    updated: normalizedFrontmatter.updated,
    cover: data.cover,
    draft: data.draft,
  };

  const publishedFrontmatter = {
    title: normalizedFrontmatter.title,
    folder: normalizedFrontmatter.folder,
    summary: normalizedFrontmatter.summary,
    tags: normalizedFrontmatter.tags,
    id: normalizedFrontmatter.id,
    date: normalizedFrontmatter.date,
    updated: normalizedFrontmatter.updated,
    cover: publishedCover,
  };

  const relativeFileName = `${normalizedFrontmatter.id}.md`;
  const outputPath = path.join(rootDir, "src", "content", "blog", year, month, relativeFileName);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(absoluteNotePath, `${formatFrontmatter(sourceFrontmatter, { includeDraft: true })}${body}`, "utf8");
  await writeFile(outputPath, `${formatFrontmatter(publishedFrontmatter, { includeDraft: false })}${publishedBody}`, "utf8");

  const gitPaths = [
    absoluteNotePath,
    outputPath,
    ...new Set([...copiedAssets.values()].map((item) => item.destinationPath)),
  ];

  await execGitOrThrow(rootDir, execGit, "add", ...gitPaths);
  await execGitOrThrow(rootDir, execGit, "commit", "-m", `publish: ${normalizedFrontmatter.title}`);
  await execGitOrThrow(rootDir, execGit, "push");

  return {
    frontmatter: publishedFrontmatter,
    outputPath,
    copiedAssets: [...copiedAssets.values()],
  };
}

async function main() {
  const notePath = process.argv[2];
  const result = await publishNote({ notePath });
  process.stdout.write(`已发布：${result.outputPath}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
}
