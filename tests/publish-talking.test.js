import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import os from "node:os";
import vm from "node:vm";
import { mkdtemp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

import { publishTalking, renderTalkingMarkdown } from "../script/publish-talking.js";

const FIXED_NOW = new Date("2026-03-29T12:34:56.000Z");

async function createWorkspace() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "obsidian-talking-"));
  await mkdir(path.join(rootDir, "src", "page_data"), { recursive: true });
  await mkdir(path.join(rootDir, "public", "assets"), { recursive: true });
  await writeFile(
    path.join(rootDir, "src", "page_data", "Talking.ts"),
    `export default {
  api: '',
  data: [
    {
      "date": "2024-10-05 16:16:06",
      "tags": [
        "日常"
      ],
      "content": "记录第一条说说"
    }
  ]
}
`,
    "utf8"
  );
  return rootDir;
}

async function readTalkingData(rootDir) {
  const filePath = path.join(rootDir, "src", "page_data", "Talking.ts");
  const source = await readFile(filePath, "utf8");
  const expression = source.replace(/^\s*export\s+default\s+/, "");
  return JSON.parse(JSON.stringify(vm.runInNewContext(`(${expression})`)));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

test("发布 Markdown 动态时会写入 Talking.ts 顶部并保留 Markdown 原文", async () => {
  const rootDir = await createWorkspace();
  const gitCalls = [];

  await publishTalking({
    rootDir,
    payload: {
      markdown: "第一条动态\n\n第二段内容",
      attachments: [],
      date: "2026-03-29 12:34:56",
    },
    now: FIXED_NOW,
    renderMarkdown: async (markdown) => `<p>${markdown}</p>`,
    execGit: async (...args) => {
      gitCalls.push(args);
      return { code: 0, stdout: "", stderr: "" };
    },
  });

  const talking = await readTalkingData(rootDir);

  assert.equal(talking.data.length, 2);
  assert.equal(talking.data[0].date, "2026-03-29 12:34:56");
  assert.deepEqual(talking.data[0].tags, []);
  assert.equal(talking.data[0].markdown, "第一条动态\n\n第二段内容");
  assert.equal(talking.data[0].content, "<p>第一条动态\n\n第二段内容</p>");
  assert.deepEqual(gitCalls, [
    ["add", path.join(rootDir, "src", "page_data", "Talking.ts")],
    ["commit", "-m", "talking: 第一条动态 第二段内容"],
    ["push"],
  ]);
});

test("发布带图片的动态时会复制资源并重写 Markdown 图片地址", async () => {
  const rootDir = await createWorkspace();
  const imageBuffer = Buffer.from("talking-image");
  const imagePath = path.join(rootDir, "temp-image.png");
  const imageHash = sha256(imageBuffer);
  const expectedRelativeAssetPath = `/assets/uploads/2026/03/${imageHash}.png`;
  const expectedOutputAssetPath = path.join(
    rootDir,
    "public",
    "assets",
    "uploads",
    "2026",
    "03",
    `${imageHash}.png`
  );
  const gitCalls = [];
  let renderedMarkdown = "";

  await writeFile(imagePath, imageBuffer);

  await publishTalking({
    rootDir,
    payload: {
      markdown: "今天发图\n\n![封面](qa-asset://img-1)",
      attachments: [
        {
          id: "img-1",
          name: "封面.png",
          path: imagePath,
          source: "import",
        },
      ],
      date: "2026-03-29 12:34:56",
    },
    now: FIXED_NOW,
    renderMarkdown: async (markdown) => {
      renderedMarkdown = markdown;
      return `<p>${markdown}</p>`;
    },
    execGit: async (...args) => {
      gitCalls.push(args);
      return { code: 0, stdout: "", stderr: "" };
    },
  });

  const talking = await readTalkingData(rootDir);
  const assetStat = await stat(expectedOutputAssetPath);

  assert.equal(assetStat.isFile(), true);
  assert.match(renderedMarkdown, new RegExp(expectedRelativeAssetPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.equal(talking.data[0].markdown, `今天发图\n\n![封面](${expectedRelativeAssetPath})`);
  assert.match(talking.data[0].content, new RegExp(expectedRelativeAssetPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.deepEqual(gitCalls, [
    [
      "add",
      path.join(rootDir, "src", "page_data", "Talking.ts"),
      expectedOutputAssetPath,
    ],
    ["commit", "-m", "talking: 今天发图"],
    ["push"],
  ]);
});

test("动态内容为空时直接报错且不会执行 git", async () => {
  const rootDir = await createWorkspace();
  let gitCalled = false;

  await assert.rejects(
    publishTalking({
      rootDir,
      payload: {
        markdown: "   \n\t",
        attachments: [],
        date: "2026-03-29 12:34:56",
      },
      now: FIXED_NOW,
      renderMarkdown: async () => "<p>ignored</p>",
      execGit: async () => {
        gitCalled = true;
        return { code: 0, stdout: "", stderr: "" };
      },
    }),
    /内容不能为空/
  );

  assert.equal(gitCalled, false);
});

test("动态 Markdown 渲染会复用文章的自定义指令和代码块包装", async () => {
  const html = await renderTalkingMarkdown(`:::note{type="info"}\n你好\n:::\n\n\`\`\`js\nconsole.log(1)\n\`\`\``);

  assert.match(html, /vh-node vh-note note-info/);
  assert.match(html, /vh-code-box/);
});
