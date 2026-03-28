import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  runPublishNote,
  defaultExecPublishCommand,
  getNodeCommandCandidates,
} = require("../script/quickadd-publish-note.cjs");

test("QuickAdd 发布脚本会读取当前活动文件并通过子进程调用发布脚本", async () => {
  const calls = [];
  const notices = [];
  const params = {
    app: {
      workspace: {
        getActiveFile() {
          return { path: "notes/posts/demo.md" };
        },
      },
      vault: {
        adapter: {
          getBasePath() {
            return "/tmp/blog-vault";
          },
        },
      },
    },
  };

  const result = await runPublishNote(params, {
    execPublishCommand: async (options) => {
      calls.push(options);
      return {
        code: 0,
        stdout: "已发布：/tmp/blog-vault/src/content/blog/2026/03/demo.md\n",
        stderr: "",
      };
    },
    notify: (message) => {
      notices.push(message);
    },
  });

  assert.equal(result.outputPath, "/tmp/blog-vault/src/content/blog/2026/03/demo.md");
  assert.deepEqual(calls, [
    {
      rootDir: "/tmp/blog-vault",
      notePath: "notes/posts/demo.md",
      scriptPath: "/tmp/blog-vault/script/publish-note.js",
    },
  ]);
  assert.deepEqual(notices, ["博客已发布：/tmp/blog-vault/src/content/blog/2026/03/demo.md"]);
});

test("QuickAdd 发布脚本在没有活动文件时会报错", async () => {
  const params = {
    app: {
      workspace: {
        getActiveFile() {
          return null;
        },
      },
      vault: {
        adapter: {
          getBasePath() {
            return "/tmp/blog-vault";
          },
        },
      },
    },
  };

  await assert.rejects(
    runPublishNote(params, {
      execPublishCommand: async () => {
        throw new Error("should not load");
      },
    }),
    /活动文件/
  );
});

test("QuickAdd 发布脚本在子进程失败时会透出 stderr", async () => {
  const params = {
    app: {
      workspace: {
        getActiveFile() {
          return { path: "notes/posts/demo.md" };
        },
      },
      vault: {
        adapter: {
          getBasePath() {
            return "/tmp/blog-vault";
          },
        },
      },
    },
  };

  await assert.rejects(
    runPublishNote(params, {
      execPublishCommand: async () => ({
        code: 1,
        stdout: "",
        stderr: "draft 笔记不能直接发布。",
      }),
    }),
    /draft 笔记不能直接发布/
  );
});

test("QuickAdd 发布脚本在没有 stderr 时会抛出带上下文的错误", async () => {
  const params = {
    app: {
      workspace: {
        getActiveFile() {
          return { path: "notes/posts/demo.md" };
        },
      },
      vault: {
        adapter: {
          getBasePath() {
            return "/tmp/blog-vault";
          },
        },
      },
    },
  };

  await assert.rejects(
    runPublishNote(params, {
      execPublishCommand: async () => ({
        code: 1,
        stdout: "",
        stderr: "",
        attempts: [{ command: "/Applications/Obsidian.app/Contents/MacOS/Obsidian", code: 1 }],
      }),
    }),
    (error) => {
      assert.match(error.message, /发表博客失败/);
      assert.match(error.message, /notes\/posts\/demo\.md/);
      assert.match(error.message, /script\/publish-note\.js/);
      assert.match(error.message, /Obsidian\.app/);
      return true;
    }
  );
});

test("Electron 环境下会优先选择真正的 node 命令候选", () => {
  const candidates = getNodeCommandCandidates({
    execPath: "/Applications/Obsidian.app/Contents/MacOS/Obsidian",
    platform: "darwin",
  });

  assert.deepEqual(candidates, [
    "/opt/homebrew/bin/node",
    "/usr/local/bin/node",
    "node",
    "nodejs",
  ]);
});

test("defaultExecPublishCommand 会在首个候选失败后继续尝试下一个 node 命令", async () => {
  const calls = [];
  const result = await defaultExecPublishCommand(
    {
      rootDir: "/tmp/blog-vault",
      notePath: "notes/posts/demo.md",
      scriptPath: "/tmp/blog-vault/script/publish-note.js",
    },
    {
      execPath: "/Applications/Obsidian.app/Contents/MacOS/Obsidian",
      platform: "darwin",
      execFileAsync: async (command, args, options) => {
        calls.push({ command, args, options });
        if (command === "/opt/homebrew/bin/node") {
          const error = new Error("spawn ENOENT");
          error.code = "ENOENT";
          error.stderr = "";
          error.stdout = "";
          throw error;
        }

        return {
          stdout: "已发布：/tmp/blog-vault/src/content/blog/2026/03/demo.md\n",
          stderr: "",
        };
      },
    }
  );

  assert.equal(result.code, 0);
  assert.equal(result.command, "/usr/local/bin/node");
  assert.deepEqual(
    calls.map((item) => item.command),
    ["/opt/homebrew/bin/node", "/usr/local/bin/node"]
  );
});
