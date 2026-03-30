import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  runPublishTalking,
  defaultExecPublishTalkingCommand,
} = require("../script/quickadd-publish-talking.cjs");

function createParams() {
  return {
    app: {
      vault: {
        adapter: {
          getBasePath() {
            return "/tmp/blog-vault";
          },
        },
      },
    },
  };
}

test("QuickAdd 动态发布脚本会收集 payload 并通过子进程调用发布脚本", async () => {
  const calls = [];
  const notices = [];

  const result = await runPublishTalking(createParams(), {
    collectTalkingPayload: async () => ({
      markdown: "今天很开心",
      attachments: [],
      date: "2026-03-29 12:34:56",
    }),
    execPublishCommand: async (options) => {
      calls.push(options);
      return {
        code: 0,
        stdout: "已发布：/tmp/blog-vault/src/page_data/Talking.ts\n",
        stderr: "",
      };
    },
    notify: (message) => {
      notices.push(message);
    },
  });

  assert.equal(result.outputPath, "/tmp/blog-vault/src/page_data/Talking.ts");
  assert.deepEqual(calls, [
    {
      rootDir: "/tmp/blog-vault",
      payload: {
        markdown: "今天很开心",
        attachments: [],
        date: "2026-03-29 12:34:56",
      },
      scriptPath: "/tmp/blog-vault/script/publish-talking.js",
    },
  ]);
  assert.deepEqual(notices, ["动态已发布：/tmp/blog-vault/src/page_data/Talking.ts"]);
});

test("QuickAdd 动态发布脚本在没有 Vault 根目录时会报错", async () => {
  const params = {
    app: {
      vault: {
        adapter: {
          getBasePath() {
            return "";
          },
        },
      },
    },
  };

  await assert.rejects(
    runPublishTalking(params, {
      collectTalkingPayload: async () => ({
        markdown: "hello",
        attachments: [],
        date: "2026-03-29 12:34:56",
      }),
    }),
    /Vault/
  );
});

test("QuickAdd 动态发布脚本在空内容时不会执行发布命令", async () => {
  let execCalled = false;

  await assert.rejects(
    runPublishTalking(createParams(), {
      collectTalkingPayload: async () => ({
        markdown: "   ",
        attachments: [],
        date: "2026-03-29 12:34:56",
      }),
      execPublishCommand: async () => {
        execCalled = true;
        return { code: 0, stdout: "", stderr: "" };
      },
    }),
    /内容不能为空/
  );

  assert.equal(execCalled, false);
});

test("QuickAdd 动态发布脚本在子进程失败时会透出 stderr", async () => {
  await assert.rejects(
    runPublishTalking(createParams(), {
      collectTalkingPayload: async () => ({
        markdown: "今天发失败了",
        attachments: [],
        date: "2026-03-29 12:34:56",
      }),
      execPublishCommand: async () => ({
        code: 1,
        stdout: "",
        stderr: "内容不能为空。",
      }),
    }),
    /内容不能为空/
  );
});

test("QuickAdd 动态发布脚本会让导入图片和粘贴图片两种 payload 都进入发布链路", async () => {
  const payloads = [];

  for (const source of ["import", "paste"]) {
    await runPublishTalking(createParams(), {
      collectTalkingPayload: async () => ({
        markdown: `![图片](qa-asset://${source}-1)`,
        attachments: [
          {
            id: `${source}-1`,
            name: `${source}.png`,
            path: `/tmp/${source}.png`,
            source,
          },
        ],
        date: "2026-03-29 12:34:56",
      }),
      execPublishCommand: async (options) => {
        payloads.push(options.payload);
        return {
          code: 0,
          stdout: "已发布：/tmp/blog-vault/src/page_data/Talking.ts\n",
          stderr: "",
        };
      },
      notify: () => {},
    });
  }

  assert.deepEqual(
    payloads.map((payload) => payload.attachments[0].source),
    ["import", "paste"]
  );
});

test("defaultExecPublishTalkingCommand 会把 payload 写入临时文件后再执行脚本", async () => {
  const calls = [];

  const result = await defaultExecPublishTalkingCommand(
    {
      rootDir: "/tmp/blog-vault",
      payload: {
        markdown: "hello",
        attachments: [],
        date: "2026-03-29 12:34:56",
      },
      scriptPath: "/tmp/blog-vault/script/publish-talking.js",
    },
    {
      execPath: "/Applications/Obsidian.app/Contents/MacOS/Obsidian",
      platform: "darwin",
      execFileAsync: async (command, args, options) => {
        calls.push({ command, args, options });
        return {
          stdout: "已发布：/tmp/blog-vault/src/page_data/Talking.ts\n",
          stderr: "",
        };
      },
    }
  );

  assert.equal(result.code, 0);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].args[0], "/tmp/blog-vault/script/publish-talking.js");
  assert.match(calls[0].args[1], /quickadd-talking-payload/);
});
