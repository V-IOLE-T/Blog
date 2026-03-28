const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");

const execFileAsync = promisify(execFile);

function pushCandidate(candidates, seen, value) {
  if (!value || seen.has(value)) {
    return;
  }
  seen.add(value);
  candidates.push(value);
}

function looksLikeNodeExecutable(command) {
  if (!command) {
    return false;
  }

  const executableName = path.basename(command).toLowerCase();
  return executableName === "node" || executableName === "node.exe" || executableName === "nodejs";
}

function getNodeCommandCandidates({
  execPath = process.execPath,
  platform = process.platform,
  env = process.env,
} = {}) {
  const candidates = [];
  const seen = new Set();

  pushCandidate(candidates, seen, env.OBSIDIAN_PUBLISH_NODE_BIN);
  pushCandidate(candidates, seen, env.QUICKADD_NODE_BIN);

  if (looksLikeNodeExecutable(execPath)) {
    pushCandidate(candidates, seen, execPath);
  }

  if (platform === "darwin") {
    pushCandidate(candidates, seen, "/opt/homebrew/bin/node");
    pushCandidate(candidates, seen, "/usr/local/bin/node");
  } else if (platform === "linux") {
    pushCandidate(candidates, seen, "/usr/local/bin/node");
    pushCandidate(candidates, seen, "/usr/bin/node");
  } else if (platform === "win32") {
    pushCandidate(candidates, seen, "C:\\Program Files\\nodejs\\node.exe");
    pushCandidate(candidates, seen, "node.exe");
  }

  pushCandidate(candidates, seen, "node");
  pushCandidate(candidates, seen, "nodejs");
  return candidates;
}

function isRetryableCommandError(error) {
  return error?.code === "ENOENT" || error?.code === "EACCES";
}

async function defaultExecPublishCommand(
  { rootDir, notePath, scriptPath },
  {
    execPath = process.execPath,
    platform = process.platform,
    env = process.env,
    execFileAsync: injectedExecFileAsync,
    execFileAsyncImpl = injectedExecFileAsync ?? execFileAsync,
  } = {}
) {
  const attempts = [];
  const commands = getNodeCommandCandidates({ execPath, platform, env });

  for (const command of commands) {
    try {
      const result = await execFileAsyncImpl(command, [scriptPath, notePath], {
        cwd: rootDir,
      });
      return {
        code: 0,
        command,
        stdout: result.stdout ?? "",
        stderr: result.stderr ?? "",
        attempts,
      };
    } catch (error) {
      const attempt = {
        command,
        code: error?.code ?? "UNKNOWN",
        stdout: error?.stdout ?? "",
        stderr: error?.stderr ?? "",
        message: error?.message ?? "",
      };
      attempts.push(attempt);

      if (isRetryableCommandError(error)) {
        continue;
      }

      return {
        code: typeof error?.code === "number" ? error.code : 1,
        command,
        stdout: error?.stdout ?? "",
        stderr: error?.stderr ?? error?.message ?? "",
        attempts,
      };
    }
  }

  return {
    code: 1,
    stdout: "",
    stderr: "",
    attempts,
  };
}

function parsePublishOutput(stdout) {
  const match = String(stdout).match(/已发布：(.+)/);
  return match ? match[1].trim() : null;
}

function formatBlock(label, value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return null;
  }
  return `${label}：${normalized}`;
}

function formatAttempts(attempts = []) {
  if (!Array.isArray(attempts) || attempts.length === 0) {
    return null;
  }

  const lines = ["尝试命令："];
  for (const attempt of attempts) {
    const detail = [attempt.command];
    if (attempt.code !== undefined) {
      detail.push(`code=${attempt.code}`);
    }
    if (attempt.message) {
      detail.push(`message=${attempt.message}`);
    }
    lines.push(`- ${detail.join(" | ")}`);
  }
  return lines.join("\n");
}

function formatPublishFailure({ notePath, scriptPath, rootDir, result }) {
  const blocks = [
    "发表博客失败。",
    formatBlock("Vault", rootDir),
    formatBlock("笔记", notePath),
    formatBlock("脚本", scriptPath),
    formatBlock("命令", result.command),
    formatAttempts(result.attempts),
    formatBlock("stderr", result.stderr),
    formatBlock("stdout", result.stdout),
  ].filter(Boolean);

  return blocks.join("\n");
}

function createDefaultNotifier(params) {
  return (message) => {
    const Notice =
      globalThis.Notice ??
      params?.app?.plugins?.plugins?.quickadd?.api?.Notice ??
      params?.obsidian?.Notice;

    if (typeof Notice === "function") {
      new Notice(message, 5000);
      return;
    }

    console.log(message);
  };
}

async function runPublishNote(
  params,
  { execPublishCommand = defaultExecPublishCommand, notify = createDefaultNotifier(params) } = {}
) {
  const app = params?.app;
  const activeFile = app?.workspace?.getActiveFile?.();
  if (!activeFile?.path) {
    throw new Error("没有活动文件，无法发表博客。");
  }

  const rootDir = app?.vault?.adapter?.getBasePath?.();
  if (!rootDir) {
    throw new Error("无法确定当前 Vault 的根目录。");
  }

  const scriptPath = path.join(rootDir, "script", "publish-note.js");
  const result = await execPublishCommand({
    rootDir,
    notePath: activeFile.path,
    scriptPath,
  });
  if (result.code !== 0) {
    throw new Error(
      formatPublishFailure({
        rootDir,
        notePath: activeFile.path,
        scriptPath,
        result,
      })
    );
  }

  const outputPath = parsePublishOutput(result.stdout);
  notify(outputPath ? `博客已发布：${outputPath}` : "博客已发布。");

  return {
    outputPath,
    stdout: result.stdout,
  };
}

module.exports = runPublishNote;
module.exports.runPublishNote = runPublishNote;
module.exports.defaultExecPublishCommand = defaultExecPublishCommand;
module.exports.getNodeCommandCandidates = getNodeCommandCandidates;
