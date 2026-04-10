---
title: "⚡ 终端效率工具常用命令速查"
outline: deep
desc: "一篇看懂 bat、eza、fd、ripgrep、fzf、btop、zoxide、jq、tldr、delta、lazygit、fnm 和 Zellij 的常用命令"
tags: "Shell/Linux/Zsh/CLI/效率工具"
updateTime: "2026-04-10 08:55:58"
---

# ⚡ 终端效率工具常用命令速查

## 概述

如果你已经在终端里装了这些常见增强工具，但平时只会 `ls`、`cat`、`find`、`grep` 这些基础命令，那么这篇文章可以当作一份 **高频命令速查表**。

本文覆盖下面这些工具：

- `bat`
- `eza`
- `fd`
- `ripgrep`
- `fzf`
- `btop`
- `zoxide`
- `jq`
- `tldr`
- `delta`
- `lazygit`
- `fnm`
- `Zellij`

## 先看替代关系

| 工具 | 常见替代 | 核心作用 |
| --- | --- | --- |
| `bat` | `cat` | 带语法高亮查看文件 |
| `eza` | `ls` | 更好看的目录列表 |
| `fd` | `find` | 更直观地查找文件 |
| `rg` | `grep` | 超快全文搜索 |
| `fzf` | 无直接替代 | 模糊选择器 |
| `btop` | `top` / `htop` | 系统资源监控 |
| `zoxide` | `cd` | 智能目录跳转 |
| `jq` | 无直接替代 | JSON 处理 |
| `tldr` | `man` | 看示例而不是看长文档 |
| `delta` | `git diff` | 彩色增强 diff |
| `lazygit` | `git` 命令组合 | Git 终端 UI |
| `fnm` | `nvm` | Node.js 版本管理 |
| `zellij` | `tmux` | 现代终端复用器 |

## bat

`bat` 最适合拿来替代 `cat` 查看配置文件、脚本和代码。

```bash
# 查看文件，自动语法高亮
bat ~/.zshrc

# 显示行号
bat -n ~/.zshrc

# 只输出内容，不走分页器
bat --paging=never ~/.zshrc

# 不加装饰，适合管道输出
bat -p ~/.zshrc
```

### 高频场景

- 看 `json`、`yaml`、`sh`、`js` 这类配置文件时比 `cat` 更清楚。
- 配合 `rg` 找到文件后，再用 `bat` 打开目标文件很顺手。

## eza

`eza` 可以理解成增强版 `ls`，支持图标、Git 状态、树形显示。

```bash
# 列出当前目录
eza

# 显示隐藏文件、详细信息
eza -la

# 带图标显示
eza --icons

# 显示 Git 状态
eza -la --git

# 树形查看目录结构，限制两层
eza --tree -L 2
```

### 高频场景

- `eza -la`：日常替代 `ls -la`
- `eza --tree -L 2`：快速浏览项目结构
- `eza -la --git`：看哪些文件已修改

## fd

`fd` 是更符合直觉的 `find`，参数更少，默认输出更干净。

```bash
# 查找文件名包含 config 的文件
fd config

# 只找 md 文件
fd -e md

# 在指定目录中搜索
fd nginx /etc

# 查找目录
fd -t d src

# 查找文件
fd -t f package
```

### 高频场景

- `fd -e md`：找所有 Markdown 文件
- `fd -t d node_modules`：定位目录
- `fd keyword path`：替代一大串 `find ... | grep ...`

## ripgrep

`ripgrep` 的命令名一般是 `rg`，适合全文搜索，速度通常远快于 `grep -r`。

```bash
# 当前目录全文搜索
rg "TODO"

# 显示行号搜索
rg -n "useEffect"

# 只搜索某种文件类型
rg -t md "Docker"

# 忽略大小写
rg -i "error"

# 搜索时包含隐藏文件
rg --hidden "VITEPRESS"

# 搜索并显示上下文
rg -n -C 2 "updateTime"
```

### 高频场景

- `rg -n 关键词`：代码库查函数、变量、配置
- `rg -t md 关键词`：只搜文档
- `rg --hidden`：把隐藏文件也一起搜进来

## fzf

`fzf` 本身是模糊筛选器，通常跟其他命令组合使用。

```bash
# 从文件列表中模糊选择一个文件
fd . | fzf

# 搜索历史命令
history | fzf

# 查找进程后结束
ps -ef | fzf

# 在 Git 分支中选择
git branch --all | fzf
```

### 最常用快捷键

- `Ctrl + R`：模糊搜索历史命令
- `Ctrl + T`：模糊插入文件路径
- `Alt + C`：模糊切换目录

### 高频场景

- `fd . | fzf`：找文件
- `git branch --all | fzf`：切换分支前先搜索
- `ps -ef | fzf`：查进程

## btop

`btop` 是终端里的资源监控面板，适合观察 CPU、内存、磁盘和进程。

```bash
# 直接启动
btop
```

### 常见操作

- 方向键：切换面板
- `f`：过滤进程
- `ESC`：返回
- `q`：退出

### 高频场景

- 机器卡顿时先开 `btop`
- 找出高 CPU / 高内存进程
- 排查 Docker、Node、数据库进程是否异常

## zoxide

`zoxide` 是智能版 `cd`，会学习你的目录访问习惯。

```bash
# 初始化（以 zsh 为例）
eval "$(zoxide init zsh)"

# 跳转到最常访问的匹配目录
z blog

# 交互式选择目录
zi
```

### 高频场景

- `z project`：不用再写完整路径
- `zi`：目录太多时交互选择

### 实用说明

第一次使用时，`zoxide` 还没有学习记录。随着你不断 `cd`、进入项目目录，它会越来越准。

## jq

`jq` 是 JSON 处理神器。只要接口返回的是 JSON，基本都能用它处理。

```bash
# 格式化输出 JSON
cat data.json | jq

# 读取某个字段
cat data.json | jq '.name'

# 读取数组
cat data.json | jq '.items[]'

# 读取嵌套字段
cat data.json | jq '.user.name'

# 只输出原始字符串，不带引号
cat data.json | jq -r '.version'
```

### 高频场景

- `curl 接口 | jq`：直接美化 API 返回结果
- `jq -r`：提取字符串变量给 shell 使用
- `jq '.items[] | .id'`：遍历数组字段

## tldr

`tldr` 可以理解成“精简版 man 手册”，重点是给你看最常用示例。

```bash
# 查看 tar 的常见示例
tldr tar

# 查看 curl 的常见示例
tldr curl

# 更新本地缓存
tldr -u
```

### 高频场景

- 忘了某条命令怎么写时，先 `tldr`
- 尤其适合 `tar`、`find`、`ssh`、`docker`、`git` 这类参数多的命令

## delta

`delta` 主要用来增强 `git diff`、`git show` 的显示效果。

```bash
# 单次使用 delta 查看 diff
git -c core.pager=delta diff

# 查看某次提交内容
git -c core.pager=delta show HEAD
```

### 建议配置

把 `delta` 设成 Git 默认分页器后，日常体验会更好。

```bash
git config --global core.pager delta
git config --global interactive.diffFilter "delta --color-only"
git config --global delta.navigate true
git config --global delta.side-by-side true
```

### 高频场景

- `git diff`
- `git show`
- `git log -p`

## lazygit

`lazygit` 是 Git 的终端 UI，适合不想频繁敲长命令的时候使用。

```bash
# 在当前 Git 仓库启动
lazygit

# 在指定目录启动
lazygit -p ~/code/my-project
```

### 进入后最常用按键

- `q`：退出
- `space`：暂存 / 取消暂存
- `c`：提交 commit
- `P`：push
- `p`：pull
- `b`：分支面板
- `l`：日志面板

### 高频场景

- 快速查看变更
- 批量暂存文件
- 图形化切分支、看提交记录、执行 push/pull

## fnm

`fnm` 是快速的 Node.js 版本管理器，通常比 `nvm` 启动更快。

```bash
# 查看当前版本
fnm current

# 查看已安装版本
fnm list

# 安装最新 LTS
fnm install --lts

# 安装指定版本
fnm install 22

# 切换版本
fnm use 22

# 设为默认版本
fnm default 22
```

### Shell 初始化

```bash
# zsh
eval "$(fnm env --use-on-cd --shell zsh)"
```

### 高频场景

- `fnm install --lts`：新机器常用
- `fnm use 20` / `fnm use 22`：不同项目切版本
- `fnm env --use-on-cd`：进入项目自动切换 Node 版本

## Zellij

`Zellij` 是现代终端复用器，适合替代部分 `tmux` 使用场景。

```bash
# 启动
zellij

# 查看会话
zellij ls

# 附加到最近会话
zellij a

# 附加到指定会话
zellij attach my-session

# 杀掉所有会话
zellij kill-all-sessions
```

### 常见操作

- `Ctrl + p`：打开面板模式
- `Ctrl + q`：退出当前模式
- `Alt + n`：新建 pane
- `Alt + h/j/k/l`：切换 pane

### 高频场景

- 一边跑服务、一边看日志、一边编辑文件
- SSH 到远程机器后保持多面板工作流

## 一套顺手的组合拳

下面这组组合在日常开发里非常高频：

```bash
# 1. 先用 eza 看目录
eza -la

# 2. 用 fd 找文件
fd vitepress docs

# 3. 用 rg 搜内容
rg -n "updateTime" docs/src

# 4. 用 bat 打开文件
bat docs/src/index.md

# 5. 用 jq 处理接口返回
curl -s https://api.github.com/repos/jqlang/jq | jq '.stargazers_count'
```

如果你已经在用 `zsh`，那么再配上 `fzf`、`zoxide`、`fnm`，整个终端效率会比原生命令顺手很多。

## 我最推荐先记住的命令

如果你不想一次记太多，先把下面这些记熟就够用了：

```bash
bat file
eza -la
eza --tree -L 2
fd keyword
rg -n keyword
z project
jq '.field'
tldr tar
git -c core.pager=delta diff
lazygit
fnm install --lts
zellij a
```

## 总结

这些工具的价值不在于“花哨”，而在于它们把终端里最常见的几个动作都做得更快了：

- `看文件` 用 `bat`
- `看目录` 用 `eza`
- `找文件` 用 `fd`
- `搜内容` 用 `rg`
- `模糊选择` 用 `fzf`
- `跳目录` 用 `zoxide`
- `看 JSON` 用 `jq`
- `查命令示例` 用 `tldr`

如果你是刚开始配置终端环境，建议优先掌握 `eza + fd + rg + bat + zoxide + fzf` 这一组，收益最大。
