# 📚 Obsidian高亮词汇提取工具 - 文档索引

> ⚡ 3分钟配置，一键提取高亮词汇，自动生成生词本！

## 🚀 快速导航

| 文档 | 适用场景 | 阅读时间 |
|------|---------|---------|
| [[快速开始]] | 🔥 **从这里开始！** 立即使用工具 | 2分钟 |
| [[完整配置指南]] | 配置快捷键和工具栏按钮 | 3分钟 |
| [[README]] | 了解技术细节和完整功能 | 5分钟 |
| [[shell-commands-config]] | Shell commands插件详细配置 | 5分钟 |
| [[项目总结]] | 查看项目完成情况和技术方案 | 2分钟 |

---

## ✨ 核心特性

- ✅ **自动提取**：识别 `==高亮文本==` 格式
- ✅ **智能去重**：相同词汇只保存一次
- ✅ **按日期分类**：自动创建 `YYYY-MM-DD-生词.md`
- ✅ **快捷键支持**：一键完成提取
- ✅ **离线工作**：无需网络连接
- ✅ **完全免费**：开源Python脚本

---

## 📖 使用流程

```mermaid
graph LR
    A[打开笔记] --> B[按下快捷键]
    B --> C[自动提取高亮]
    C --> D[去重处理]
    D --> E[追加到生词本]
    E --> F[查看结果]
```

### 详细步骤

1. **安装插件**（1分钟）
   - Obsidian → 设置 → 社区插件
   - 搜索并安装 "Shell commands"

2. **配置命令**（1分钟）
   - 命令名：`提取高亮词汇`
   - Shell：`python`
   - Command：`.obsidian/scripts/extract_highlights.py`
   - Arguments：`"{{file:path}}"`

3. **设置快捷键**（30秒）
   - 在插件设置中为命令添加快捷键
   - 推荐：`Ctrl + Shift + V`

4. **开始使用**（30秒）
   - 打开包含 `==高亮==` 的笔记
   - 按下快捷键
   - 完成！

详细步骤请查看 [[完整配置指南]]

---

## 💡 为什么选择Python而不是LLM？

| 对比项 | ✅ Python脚本 | ❌ LLM大模型 |
|--------|-------------|-------------|
| **速度** | 0.1秒 | 5-30秒 |
| **成本** | 完全免费 | 需要付费 |
| **网络** | 不需要 | 必需 |
| **准确率** | 100% | 95% |
| **隐私** | 本地处理 | 数据上传 |
| **适用性** | ✅ 完美适配 | ❌ 过度设计 |

**结论**：用正则表达式0.1秒就能完美解决，用LLM是"杀鸡用牛刀"。

---

## 📂 文件结构

```
.obsidian/scripts/
├── extract_highlights.py          # 主程序（80行Python代码）
├── extract_highlights.bat         # Windows快捷方式
├── INDEX.md                       # 📚 本文件（总索引）
├── 快速开始.md                     # 🚀 立即开始
├── 完整配置指南.md                  # ⚡ 3分钟配置
├── README.md                       # 📖 完整文档
├── shell-commands-config.md        # 🔧 Shell命令配置
└── 项目总结.md                     # 📋 项目总结
```

---

## 🎯 使用示例

### 输入（你的笔记）
```markdown
## 雅思阅读 - 制冷技术

The invention of ==refrigeration== changed food storage.
Early machines used ==toxic== chemicals.
```

### 操作
按下快捷键：`Ctrl + Shift + V`

### 输出（生词本）
文件：`3-专业学习/雅思/生词/2026-03-09-生词.md`
```markdown
refrigeration
toxic
```

---

## 🛠️ 高级配置

### 多科目管理

为不同科目配置不同命令：

| 命令名称 | 输出路径 | 快捷键 |
|---------|---------|--------|
| 提取雅思高亮 | `3-专业学习/雅思/生词` | `Ctrl+Shift+1` |
| 提取托福高亮 | `3-专业学习/托福/生词` | `Ctrl+Shift+2` |
| 提取GRE高亮 | `3-专业学习/GRE/生词` | `Ctrl+Shift+3` |

配置方法：修改 Arguments 为
```
"{{file:path}}" "3-专业学习/托福/生词"
```

### 自定义默认路径

编辑 `extract_highlights.py` 第13行：
```python
DEFAULT_OUTPUT_DIR = "你的/自定义/路径"
```

---

## 🎓 学习建议

1. **及时提取**：阅读完文章立即提取高亮词汇
2. **手动补充**：添加音标、词性、翻译（记忆更深刻）
3. **定期复习**：每天查看当天生成的生词文件
4. **分类管理**：为不同科目使用不同路径
5. **配合工具**：导出到Anki进行间隔重复学习

---

## ❓ 常见问题

<details>
<summary><b>Q: 如何修改默认输出路径？</b></summary>

编辑 `extract_highlights.py` 第13行的 `DEFAULT_OUTPUT_DIR` 变量。
</details>

<details>
<summary><b>Q: 可以提取词性、翻译吗？</b></summary>

可以修改脚本添加这些功能，但我建议保持简洁，手动补充效果更好。
</details>

<details>
<summary><b>Q: 会重复提取吗？</b></summary>

不会。脚本内置智能去重功能，相同词汇只保存一次。
</details>

<details>
<summary><b>Q: 如何添加到工具栏？</b></summary>

使用 **Customizable Toolbar** 插件，将"提取高亮词汇"命令添加到工具栏。
</details>

<details>
<summary><b>Q: 支持macOS/Linux吗？</b></summary>

完全支持！只需将 `python` 改为 `python3` 即可。
</details>

---

## 📞 获取帮助

遇到问题？按顺序查看：

1. [[快速开始]] - 基础使用
2. [[完整配置指南]] - 配置教程
3. [[README]] - 完整文档
4. [[shell-commands-config]] - Shell命令配置

---

## 🎉 开始使用

**第1步**：阅读 [[快速开始]]
**第2步**：配置Shell commands插件
**第3步**：设置快捷键
**第4步**：开始高效积累词汇！

---

*最后更新：2026-03-09*
