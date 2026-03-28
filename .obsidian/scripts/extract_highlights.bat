@echo off
chcp 65001 >nul
echo ======================================
echo   Obsidian 高亮词汇提取工具
echo ======================================
echo.

REM 检查是否提供了文件路径参数
if "%~1"=="" (
    echo ❌ 错误：未提供笔记文件路径
    echo.
    echo 使用方法：
    echo   方法1：拖拽笔记文件到此批处理文件上
    echo   方法2：extract_highlights.bat "笔记路径.md"
    echo   方法3：在Obsidian中配置快捷键运行
    echo.
    pause
    exit /b 1
)

REM 运行Python脚本
python "%~dp0extract_highlights.py" %*

REM 如果成功，显示完成信息
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ 完成！
    echo.
) else (
    echo.
    echo ❌ 出错了，请检查文件路径是否正确
    echo.
)

pause
