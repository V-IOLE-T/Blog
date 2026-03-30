import path from "node:path";
import vm from "node:vm";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { copyFile, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";

import { markdownConfig } from "../src/markdown/config.js";

class PublishTalkingError extends Error {}

let markdownProcessorPromise;

function formatDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function loadAstroMarkdownRemark(rootDir) {
  const pnpmDir = path.join(rootDir, "node_modules", ".pnpm");
  const entries = await readdir(pnpmDir, { withFileTypes: true });
  const packageDir = entries.find(
    (entry) => entry.isDirectory() && entry.name.startsWith("@astrojs+markdown-remark@")
  );

  if (!packageDir) {
    throw new PublishTalkingError("未找到 Astro Markdown 渲染依赖，请先执行 pnpm install。");
  }

  const modulePath = path.join(
    pnpmDir,
    packageDir.name,
    "node_modules",
    "@astrojs",
    "markdown-remark",
    "dist",
    "index.js"
  );
  return import(pathToFileURL(modulePath).href);
}

async function getMarkdownProcessor(rootDir) {
  if (!markdownProcessorPromise) {
    markdownProcessorPromise = (async () => {
      const { createMarkdownProcessor } = await loadAstroMarkdownRemark(rootDir);
      return createMarkdownProcessor(markdownConfig);
    })();
  }

  return markdownProcessorPromise;
}

export async function renderTalkingMarkdown(markdown, { rootDir = process.cwd() } = {}) {
  const processor = await getMarkdownProcessor(rootDir);
  const rendered = await processor.render(markdown, {
    fileURL: pathToFileURL(path.join(rootDir, "src", "page_data", "Talking.virtual.md")),
    frontmatter: {},
  });
  return rendered.code;
}

async function listFilesRecursively(dirPath) {
  let dirEntries = [];
  try {
    dirEntries = await readdir(dirPath, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const files = [];
  for (const entry of dirEntries) {
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
      throw new PublishTalkingError(`notes/assets 中存在重名附件：${baseName}`);
    }
  }

  return new Map([...index.entries()].map(([baseName, [assetPath]]) => [baseName, assetPath]));
}

function normalizePayload(payload, now) {
  if (!payload || typeof payload !== "object") {
    throw new PublishTalkingError("请提供要发布的动态内容。");
  }

  const markdown = String(payload.markdown || "").trim();
  if (!markdown) {
    throw new PublishTalkingError("动态内容不能为空。");
  }

  const date = String(payload.date || formatDate(now)).trim();
  const attachments = [
    ...(Array.isArray(payload.attachments) ? payload.attachments : []),
    ...(Array.isArray(payload.assets) ? payload.assets : []),
  ].map((item) => ({
    id: String(item.id || "").trim(),
    path: String(item.path || item.sourcePath || "").trim(),
    name: String(item.name || item.fileName || path.basename(String(item.path || item.sourcePath || "")) || "image")
      .trim(),
    source: String(item.source || "import").trim(),
    placeholder: String(item.placeholder || "").trim(),
  }));

  return { markdown, attachments, date };
}

async function ensureAssetCopied({ sourcePath, fileName, rootDir, now, copiedAssets }) {
  if (copiedAssets.has(sourcePath)) {
    return copiedAssets.get(sourcePath);
  }

  const assetBuffer = await readFile(sourcePath);
  const hash = createHash("sha256").update(assetBuffer).digest("hex");
  const extension =
    path.extname(fileName || sourcePath).toLowerCase() ||
    path.extname(sourcePath).toLowerCase() ||
    ".png";
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const publicPath = path.posix.join("/assets", "uploads", year, month, `${hash}${extension}`);
  const destinationPath = path.join(
    rootDir,
    "public",
    "assets",
    "uploads",
    year,
    month,
    `${hash}${extension}`
  );

  await mkdir(path.dirname(destinationPath), { recursive: true });
  try {
    await stat(destinationPath);
  } catch {
    await copyFile(sourcePath, destinationPath);
  }

  const record = {
    sourcePath,
    destinationPath,
    fileName: fileName || path.basename(sourcePath),
    publicPath,
  };
  copiedAssets.set(sourcePath, record);
  return record;
}

async function rewritePayloadAssets(markdown, attachments, context) {
  let nextMarkdown = markdown;

  for (const attachment of attachments) {
    if (!attachment.path) {
      throw new PublishTalkingError("动态附件缺少 sourcePath。");
    }

    const copiedAsset = await ensureAssetCopied({
      sourcePath: attachment.path,
      fileName: attachment.name,
      ...context,
    });

    if (attachment.placeholder) {
      nextMarkdown = nextMarkdown.split(attachment.placeholder).join(copiedAsset.publicPath);
      continue;
    }

    if (attachment.id) {
      const assetPattern = new RegExp(`qa-asset://${escapeRegExp(attachment.id)}(?:/[\\w.-]+)?`, "g");
      nextMarkdown = nextMarkdown.replace(assetPattern, copiedAsset.publicPath);
    }
  }

  return nextMarkdown;
}

async function rewriteWikiEmbeds(markdown, context) {
  const wikiEmbedPattern = /!\[\[([^|\]]+)\]\]/g;
  const assetIndex = await buildAssetIndex(path.join(context.rootDir, "notes", "assets"));
  let nextMarkdown = "";
  let lastIndex = 0;

  for (const match of markdown.matchAll(wikiEmbedPattern)) {
    nextMarkdown += markdown.slice(lastIndex, match.index);
    const assetName = match[1].trim();
    const sourcePath = assetIndex.get(assetName);
    if (!sourcePath) {
      throw new PublishTalkingError(`未在 notes/assets 中找到附件：${assetName}`);
    }

    const copiedAsset = await ensureAssetCopied({
      sourcePath,
      fileName: assetName,
      ...context,
    });
    nextMarkdown += `![${path.parse(assetName).name}](${copiedAsset.publicPath})`;
    lastIndex = match.index + match[0].length;
  }

  nextMarkdown += markdown.slice(lastIndex);
  return nextMarkdown;
}

function parseTalkingModule(source) {
  const expression = source.replace(/^\s*export\s+default\s+/, "").trim().replace(/;$/, "");
  return vm.runInNewContext(`(${expression})`);
}

function stringifyTalkingModule(data) {
  const serializeArray = (items) =>
    `globalThis.constructor.constructor("return Array")().from(${JSON.stringify(items)})`;
  const serializeEntry = (entry) => `{
      "date": ${JSON.stringify(entry.date)},
      "tags": ${serializeArray(Array.isArray(entry.tags) ? entry.tags : [])},
      ${entry.markdown !== undefined ? `"markdown": ${JSON.stringify(entry.markdown)},\n      ` : ""}"content": ${JSON.stringify(entry.content)}
    }`;

  return `export default {
  // 可选远程数据源，返回格式需与 data 保持一致
  api: ${JSON.stringify(data.api || "")},
  // 默认使用本地 data 数据，留空即可
  // 注意：图片请用 vh-img-flex 类包裹
  data: [
    ${Array.isArray(data.data) ? data.data.map(serializeEntry).join(",\n    ") : ""}
  ]
}
`;
}

function createCommitTitle(markdown) {
  return (
    markdown
      .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/`{1,3}[^`]*`{1,3}/g, " ")
      .replace(/^#+\s+/gm, "")
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, "")
      .replace(/[*_~>#]/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "new talking"
  ).slice(0, 48);
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
    throw new PublishTalkingError(`git ${args.join(" ")} 执行失败：${result.stderr || result.stdout}`);
  }
  return result;
}

export async function publishTalking({
  rootDir = process.cwd(),
  payload,
  now = new Date(),
  renderMarkdown = (markdown) => renderTalkingMarkdown(markdown, { rootDir }),
  execGit = (...args) => runGitCommand(rootDir, args),
} = {}) {
  const normalizedPayload = normalizePayload(payload, now);
  const copiedAssets = new Map();
  const rewrittenMarkdown = await rewriteWikiEmbeds(
    await rewritePayloadAssets(normalizedPayload.markdown, normalizedPayload.attachments, {
      rootDir,
      now,
      copiedAssets,
    }),
    { rootDir, now, copiedAssets }
  );
  const content = await renderMarkdown(rewrittenMarkdown);

  const talkingPath = path.join(rootDir, "src", "page_data", "Talking.ts");
  const talkingData = parseTalkingModule(await readFile(talkingPath, "utf8"));
  talkingData.data = [
    {
      date: normalizedPayload.date,
      tags: [],
      markdown: rewrittenMarkdown,
      content,
    },
    ...(Array.isArray(talkingData.data) ? talkingData.data : []),
  ];

  await writeFile(talkingPath, stringifyTalkingModule(talkingData), "utf8");

  const gitPaths = [
    talkingPath,
    ...[...copiedAssets.values()].map((item) => item.destinationPath),
  ];
  await execGitOrThrow(rootDir, execGit, "add", ...gitPaths);
  await execGitOrThrow(
    rootDir,
    execGit,
    "commit",
    "-m",
    `talking: ${createCommitTitle(rewrittenMarkdown)}`
  );
  await execGitOrThrow(rootDir, execGit, "push");

  return {
    outputPath: talkingPath,
    copiedAssets: [...copiedAssets.values()],
  };
}

async function main() {
  const payloadPath = process.argv[2];
  if (!payloadPath) {
    throw new PublishTalkingError("请提供动态 payload 文件路径。");
  }

  const payload = JSON.parse(await readFile(payloadPath, "utf8"));
  const result = await publishTalking({
    rootDir: payload.rootDir || process.cwd(),
    payload,
    now: payload.now ? new Date(payload.now) : new Date(),
  });
  process.stdout.write(`已发布：${result.outputPath}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
}
