# Obsidian高亮词汇提取工具

## 功能说明

从当前打开的笔记中提取所有高亮词汇（`==word==`格式），去重后追加到生词本文件。

## 使用方法

### 方法1：通过Obsidian快捷命令（推荐）

1. 安装插件：**Hotkeys for specific files** 或 **QuickAdd**
2. 配置快捷键运行Python脚本
3. 设置快捷键（如 `Ctrl+Shift+V`）
4. 打开任意笔记，选中高亮词汇后按快捷键即可

### 方法2：通过命令行手动运行

```bash
# 使用默认路径（3-专业学习/雅思/生词）
python .obsidian/scripts/extract_highlights.py "当前笔记.md"

# 使用自定义路径
python .obsidian/scripts/extract_highlights.py "当前笔记.md" "自定义/输出/路径"
```

### 方法3：通过Obsidian Shell Commands（推荐）

1. 安装 **Shell commands** 插件
2. 添加新命令：
   ```bash
   python ".obsidian/scripts/extract_highlights.py "{{file:path}}"
   ```
3. 设置快捷键或添加到工具栏

## 输出格式

- **文件名**：`2026-03-09-生词.md`（使用当天日期）
- **内容格式**：每行一个词汇，直接追加到文件末尾
- **去重**：自动去除重复词汇
- **不包含上下文**：只保存高亮词汇本身

## 示例

### 输入（当前笔记）
```markdown
这是一篇雅思阅读文章。

我们要学习 ==dedicated== 这个词，它表示"专注的"。

还有 ==streams and ponds==，意思是"溪流和池塘"。
```

### 输出（2026-03-09-生词.md）
```markdown
dedicated
streams and ponds
```

## 配置修改

修改脚本中的 `DEFAULT_OUTPUT_DIR` 变量来改变默认输出路径：

```python
DEFAULT_OUTPUT_DIR = "你的/自定义/路径"  # 默认输出路径
```

## 技术方案说明

### 为什么选择Python而不是LLM？

1. **性能**：Python 0.1秒完成，LLM需要几秒到几十秒
2. **成本**：Python完全免费，LLM需要付费
3. **准确性**：Python提取100%准确，LLM可能漏词或误提取
4. **隐私**：Python本地运行，数据不上传
5. **可靠性**：Python不需要网络，随时可用

### 为什么不用开发完整插件？

开发完整的Obsidian插件需要：
- 编写TypeScript代码
- 配置构建环境
- 调试和测试
- 提交到插件市场

而Python脚本方案：
- 5分钟即可完成
- 代码简单易懂
- 易于维护和修改
- 功能完全相同

## 常见问题

**Q: 如何添加到工具栏？**
A: 使用 **Shell commands** 插件，可以添加命令到工具栏。

**Q: 支持嵌套文件夹吗？**
A: 完全支持，输出路径会自动创建所需文件夹。

**Q: 如何修改日期格式？**
A: 修改脚本中的 `datetime.now().strftime("%Y-%m-%d")` 部分。

**Q: 可以追加更多格式信息吗？**
A: 可以修改 `append_to_vocabulary` 函数来添加额外信息（如翻译、词性等）。
