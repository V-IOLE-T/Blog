# Yohaku 接管 Blog 仓库 Implementation Plan

目标：保留当前 `Blog` 仓库 git 历史与远端，把工作树替换为 `Innei-dev/Yohaku` 源码快照，并确认本地构建与服务器接入边界。

## Task 1：确认上游与构建入口

- [ ] 验证 `git@github.com:Innei-dev/Yohaku.git` 可读
- [ ] 只读拉取私有仓库到临时目录
- [ ] 读取 `package.json`、workspace 配置、README、Dockerfile 或 compose
- [ ] 记录主 app 位置、构建命令、运行命令、关键 env

## Task 2：替换当前 Blog 工作树

- [ ] 在保留 `.git`、`HANDOFF.md`、`docs/` 的前提下，准备源代码快照替换策略
- [ ] 将 `Yohaku` 工作树复制到当前仓库
- [ ] 补充上游来源说明文件
- [ ] 检查 git 状态，确认当前仓库仍沿用原历史和远端

## Task 3：本地验证

- [ ] 识别依赖管理器和安装方式
- [ ] 运行最小只读验证命令，如列 workspace、读 env 模板、读 app 配置
- [ ] 若依赖安装成本可控，执行一次最小构建入口验证

## Task 4：服务器接入准备

- [ ] 复核本机 SSH 到服务器的命令与密钥入口
- [ ] 只做连通性确认，不在本轮直接切流
- [ ] 记录下一步服务器侧应执行的最短闭环
