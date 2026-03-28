# Shell Commands 插件配置指南

## 安装插件

在Obsidian中安装 **Shell commands** 插件（作者是 @Vinzent03）

## 配置步骤

### 1. 打开插件设置

设置 → Shell commands

### 2. 添加新命令

点击 "Create new shell command"

### 3. 配置命令

**基本配置：**
```
Command name: 提取高亮词汇
Shell: python
Arguments: ".obsidian/scripts/extract_highlights.py" "{{file:path}}"
```

**完整配置示例：**
```json
{
  "id": "extract-highlights",
  "name": "提取高亮词汇",
  "shell": "python",
  "command": ".obsidian/scripts/extract_highlights.py",
  "arguments": "\"{{file:path}}\"",
  "output-mode": "Show in status bar",
  "platform-specific": {
    "win32": {
      "shell": "python"
    },
    "darwin": {
      "shell": "python3"
    },
    "linux": {
      "shell": "python3"
    }
  }
}
```

### 4. 配置快捷键

在插件设置中找到刚创建的命令，点击 "Add hotkey"，例如：
- Windows/Linux: `Ctrl + Shift + V`
- macOS: `Cmd + Shift + V`

### 5. 添加到工具栏（可选）

1. 在插件设置中启用 "Show in command palette"
2. 或者使用 **Customizable Toolbar** 插件将命令添加到工具栏

## 使用方法

1. 打开包含高亮词汇的笔记
2. 按下快捷键（如 `Ctrl+Shift+V`）
3. 高亮词汇自动追加到生词本
4. 在状态栏看到确认信息

## 高级配置

### 使用自定义输出路径

修改命令参数：
```bash
".obsidian/scripts/extract_highlights.py" "{{file:path}}" "D.资源/生词/其他科目"
```

### 配置多个命令

可以为不同科目配置不同命令：
```
提取雅思高亮 → 3-专业学习/雅思/生词
提取托福高亮 → 3-专业学习/托福/生词
提取GRE高亮 → 3-专业学习/GRE/生词
```

## 替代方案：Hotkeys for specific files

如果不使用Shell commands，可以使用 **Hotkeys for specific files** 插件：

1. 安装插件
2. 配置快捷键到 `extract_highlights.py`
3. 设置只在特定文件类型中生效

## 替代方案：QuickAdd

使用 **QuickAdd** 插件：

1. 创建新的Macro
2. 添加用户脚本类型
3. 输入Python脚本路径和参数
4. 设置快捷键
