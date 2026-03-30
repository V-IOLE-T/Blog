const os = require("node:os");
const path = require("node:path");
const { randomUUID, createHash } = require("node:crypto");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const { mkdir, readFile, rm, writeFile } = require("node:fs/promises");

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

async function defaultExecPublishTalkingCommand(
  { rootDir, payload, scriptPath },
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
  const payloadPath = path.join(os.tmpdir(), `quickadd-talking-payload-${randomUUID()}.json`);

  await writeFile(payloadPath, JSON.stringify(payload), "utf8");

  try {
    for (const command of commands) {
      try {
        const result = await execFileAsyncImpl(command, [scriptPath, payloadPath], {
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
  } finally {
    await rm(payloadPath, { force: true }).catch(() => undefined);
  }
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

function formatPublishFailure({ scriptPath, rootDir, result }) {
  return [
    "发表动态失败。",
    formatBlock("Vault", rootDir),
    formatBlock("脚本", scriptPath),
    formatBlock("命令", result.command),
    formatAttempts(result.attempts),
    formatBlock("stderr", result.stderr),
    formatBlock("stdout", result.stdout),
  ]
    .filter(Boolean)
    .join("\n");
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

function sanitizeFileName(fileName) {
  return String(fileName || "image")
    .replace(/[^\p{Letter}\p{Number}._-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function createAttachmentId() {
  return randomUUID().replace(/-/g, "");
}

function getFileExtension(file) {
  const byName = path.extname(file?.name || "").toLowerCase();
  if (byName) {
    return byName;
  }
  const mime = String(file?.type || "").toLowerCase();
  if (mime === "image/png") {
    return ".png";
  }
  if (mime === "image/jpeg") {
    return ".jpg";
  }
  if (mime === "image/webp") {
    return ".webp";
  }
  if (mime === "image/gif") {
    return ".gif";
  }
  return ".png";
}

function getFileAlt(fileName) {
  return path.parse(fileName).name || "image";
}

async function materializeComposerFile(file, source) {
  const safeBaseName =
    sanitizeFileName(file?.name || `pasted-${Date.now()}${getFileExtension(file)}`) || `image${getFileExtension(file)}`;
  const attachmentId = createAttachmentId();
  const sourcePath = typeof file?.path === "string" && file.path ? file.path : null;

  if (sourcePath) {
    return {
      id: attachmentId,
      name: safeBaseName,
      path: sourcePath,
      source,
    };
  }

  const tempDir = path.join(os.tmpdir(), "obsidian-talking-assets");
  await mkdir(tempDir, { recursive: true });
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const hash = createHash("sha256").update(buffer).digest("hex");
  const tempPath = path.join(tempDir, `${hash}${getFileExtension(file)}`);
  await writeFile(tempPath, buffer);
  return {
    id: attachmentId,
    name: safeBaseName,
    path: tempPath,
    source,
  };
}

function insertTextAtCursor(textarea, text) {
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? textarea.value.length;
  const prefix = textarea.value.slice(0, start);
  const suffix = textarea.value.slice(end);
  textarea.value = `${prefix}${text}${suffix}`;
  const nextPosition = prefix.length + text.length;
  textarea.selectionStart = nextPosition;
  textarea.selectionEnd = nextPosition;
  textarea.focus();
}

class TalkingComposerModal {
  constructor(app, options = {}) {
    this.app = app;
    this.ModalClass = options.ModalClass;
    this.attachments = [];
    this.resolvePromise = null;
    this.fileFactory = options.fileFactory ?? materializeComposerFile;
  }

  async open() {
    if (!this.ModalClass) {
      throw new Error("当前环境无法创建 Obsidian Modal。");
    }

    return new Promise((resolve, reject) => {
      const modal = new this.ModalClass(this.app);
      this.resolvePromise = resolve;
      modal.onOpen = () => {
        const { contentEl } = modal;
        contentEl.empty();
        contentEl.createEl("h2", { text: "发表动态" });

        const hint = contentEl.createEl("p", {
          text: "支持 Markdown、粘贴图片和导入本地图片。图片会自动插入到光标位置。",
        });
        hint.style.marginBottom = "12px";

        const textarea = contentEl.createEl("textarea");
        textarea.rows = 14;
        textarea.style.width = "100%";
        textarea.style.minHeight = "320px";
        textarea.style.resize = "vertical";
        textarea.placeholder = "输入动态内容…";

        const toolbar = contentEl.createDiv();
        toolbar.style.display = "flex";
        toolbar.style.gap = "8px";
        toolbar.style.margin = "12px 0";

        const importButton = toolbar.createEl("button", { text: "导入图片" });
        const submitButton = toolbar.createEl("button", { text: "发布" });
        const cancelButton = toolbar.createEl("button", { text: "取消" });

        const fileInput = contentEl.createEl("input");
        fileInput.type = "file";
        fileInput.accept = "image/*";
        fileInput.multiple = true;
        fileInput.style.display = "none";

        const attachFiles = async (files, source) => {
          for (const file of Array.from(files || [])) {
            if (
              !String(file?.type || "").startsWith("image/") &&
              !String(file?.name || "").match(/\.(png|jpe?g|gif|webp|svg)$/i)
            ) {
              continue;
            }
            const attachment = await this.fileFactory(file, source);
            this.attachments.push(attachment);
            insertTextAtCursor(textarea, `![${getFileAlt(attachment.name)}](qa-asset://${attachment.id})\n`);
          }
        };

        importButton.addEventListener("click", () => {
          fileInput.click();
        });
        fileInput.addEventListener("change", async () => {
          try {
            await attachFiles(fileInput.files, "import");
            fileInput.value = "";
          } catch (error) {
            reject(error);
            modal.close();
          }
        });
        textarea.addEventListener("paste", async (event) => {
          const imageFiles = [];
          for (const item of Array.from(event.clipboardData?.items || [])) {
            if (item.kind === "file") {
              const file = item.getAsFile();
              if (file) {
                imageFiles.push(file);
              }
            }
          }
          if (imageFiles.length === 0) {
            return;
          }
          event.preventDefault();
          try {
            await attachFiles(imageFiles, "paste");
          } catch (error) {
            reject(error);
            modal.close();
          }
        });

        submitButton.addEventListener("click", () => {
          const markdown = textarea.value.trim();
          if (!markdown) {
            reject(new Error("动态内容不能为空。"));
            modal.close();
            return;
          }
          const resolver = this.resolvePromise;
          this.resolvePromise = null;
          resolver({
            markdown,
            attachments: this.attachments,
            date: new Date().toISOString().slice(0, 19).replace("T", " "),
          });
          modal.close();
        });
        cancelButton.addEventListener("click", () => {
          const resolver = this.resolvePromise;
          this.resolvePromise = null;
          resolver(null);
          modal.close();
        });
      };
      modal.onClose = () => {
        if (this.resolvePromise) {
          const resolveCurrent = this.resolvePromise;
          this.resolvePromise = null;
          resolveCurrent(null);
        }
      };

      try {
        modal.open();
      } catch (error) {
        reject(error);
      }
    });
  }
}

function getModalClass(params) {
  if (params?.obsidian?.Modal) {
    return params.obsidian.Modal;
  }
  if (typeof globalThis.require === "function") {
    try {
      return globalThis.require("obsidian").Modal;
    } catch {
      return null;
    }
  }
  return null;
}

async function defaultCollectTalkingPayload(params) {
  const ModalClass = getModalClass(params);
  const modal = new TalkingComposerModal(params?.app, { ModalClass });
  return modal.open();
}

async function runPublishTalking(
  params,
  {
    collectTalkingPayload = defaultCollectTalkingPayload,
    execPublishCommand = defaultExecPublishTalkingCommand,
    notify = createDefaultNotifier(params),
  } = {}
) {
  const rootDir = params?.app?.vault?.adapter?.getBasePath?.();
  if (!rootDir) {
    throw new Error("无法确定当前 Vault 的根目录。");
  }

  const payload = await collectTalkingPayload(params);
  if (!payload) {
    return null;
  }

  if (!String(payload.markdown || "").trim()) {
    throw new Error("动态内容不能为空。");
  }

  const scriptPath = path.join(rootDir, "script", "publish-talking.js");
  const result = await execPublishCommand({
    rootDir,
    payload,
    scriptPath,
  });

  if (result.code !== 0) {
    throw new Error(formatPublishFailure({ scriptPath, rootDir, result }));
  }

  const outputPath = parsePublishOutput(result.stdout);
  notify(outputPath ? `动态已发布：${outputPath}` : "动态已发布。");

  return {
    outputPath,
    stdout: result.stdout,
  };
}

module.exports = runPublishTalking;
module.exports.runPublishTalking = runPublishTalking;
module.exports.defaultExecPublishTalkingCommand = defaultExecPublishTalkingCommand;
module.exports.getNodeCommandCandidates = getNodeCommandCandidates;
module.exports.TalkingComposerModal = TalkingComposerModal;
