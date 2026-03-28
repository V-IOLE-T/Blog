#!/usr/bin/env python3
"""
Obsidian高亮词汇提取工具
从当前笔记中提取高亮词汇（==word==格式）并追加到生词本
"""

import re
import sys
from pathlib import Path
from datetime import datetime

# ========== 配置区 ==========
DEFAULT_OUTPUT_DIR = "3-专业学习/雅思/生词"  # 默认输出路径
# =============================

def get_vault_root() -> Path:
    """自动定位vault根目录"""
    # 从脚本位置向上查找vault根目录（通过.obsidian文件夹判断）
    current = Path(__file__).resolve()
    for parent in [current.parent, current.parent.parent, current.parent.parent.parent]:
        if (parent / ".obsidian").exists():
            return parent
    # 如果找不到，返回脚本的祖父目录
    return current.parent.parent

VAULT_ROOT = get_vault_root()

def extract_highlights(markdown_content: str) -> list[str]:
    """
    从Markdown内容中提取所有高亮词汇

    Args:
        markdown_content: Markdown格式的文本内容

    Returns:
        去重后的高亮词汇列表（保持出现顺序）
    """
    # 匹配 ==高亮文本== 格式
    pattern = r'==([^=]+)=='
    matches = re.findall(pattern, markdown_content)

    # 去除首尾空格并去重（保持顺序）
    seen = set()
    result = []
    for word in matches:
        word = word.strip()
        if word and word not in seen:
            seen.add(word)
            result.append(word)

    return result

def get_output_path(custom_path: str = None) -> Path:
    """
    生成输出文件路径

    Args:
        custom_path: 自定义输出路径（可选）

    Returns:
        完整的输出文件路径
    """
    output_dir = VAULT_ROOT / (custom_path or DEFAULT_OUTPUT_DIR)
    output_dir.mkdir(parents=True, exist_ok=True)

    # 生成文件名：YYYY-MM-DD-生词.md
    date_str = datetime.now().strftime("%Y-%m-%d")
    filename = f"{date_str}-生词.md"

    return output_dir / filename

def append_to_vocabulary(words: list[str], output_path: Path):
    """
    将词汇追加到生词本

    Args:
        words: 词汇列表
        output_path: 输出文件路径
    """
    if not words:
        print("✅ 没有发现高亮词汇")
        return

    # 准备要追加的内容
    content = "\n".join(words) + "\n"

    # 追加到文件（如果文件存在则追加，不存在则创建）
    mode = 'a' if output_path.exists() else 'w'
    with open(output_path, mode, encoding='utf-8') as f:
        f.write(content)

    print(f"✅ 成功提取 {len(words)} 个高亮词汇")
    print(f"📄 已保存到: {output_path.relative_to(VAULT_ROOT)}")

def main():
    """主函数"""
    # 从命令行参数获取输入文件路径和可选的自定义输出路径
    if len(sys.argv) < 2:
        print("❌ 使用方法: python extract_highlights.py <当前笔记路径> [自定义输出路径]")
        sys.exit(1)

    input_file = Path(sys.argv[1])
    custom_path = sys.argv[2] if len(sys.argv) > 2 else None

    # 检查输入文件是否存在
    if not input_file.exists():
        print(f"❌ 文件不存在: {input_file}")
        sys.exit(1)

    # 读取当前笔记内容
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # 提取高亮词汇
    words = extract_highlights(content)

    # 追加到生词本
    output_path = get_output_path(custom_path)
    append_to_vocabulary(words, output_path)

if __name__ == "__main__":
    main()
