---
title: "⚡ 终端效率工具常用命令速查"
outline: deep
desc: "bat、eza、fd、ripgrep、fzf、btop、zoxide、jq、tldr、delta、lazygit、fnm 与 Zellij 的实用命令清单"
tags: "Shell/Linux/Zsh/CLI/效率工具"
updateTime: "2026-04-10 08:55:58"
---

# ⚡ 终端效率工具常用命令速查

终端效率工具的价值不是“更花”，而是把高频动作变短：看文件、列目录、找文件、搜内容、跳目录、看 JSON、查 Git、管理 Node 版本和保持远程会话。

这篇文章按使用场景整理命令。刚开始不用全记，优先掌握 `eza + fd + rg + bat + fzf + zoxide`，收益最大。

## 工具替代关系

| 场景 | 传统命令 | 推荐工具 | 作用 |
| --- | --- | --- | --- |
| 看文件 | `cat` | `bat` | 语法高亮、行号、分页 |
| 看目录 | `ls` | `eza` | 图标、Git 状态、树形目录 |
| 找文件 | `find` | `fd` | 更直观、更快 |
| 搜内容 | `grep -r` | `rg` | 高速全文搜索 |
| 模糊选择 | 手写管道 | `fzf` | 交互式筛选 |
| 看资源 | `top` | `btop` | CPU、内存、进程面板 |
| 跳目录 | `cd` | `zoxide` | 按历史频率智能跳转 |
| 处理 JSON | 手工 grep | `jq` | 结构化读取和转换 |
| 查示例 | `man` | `tldr` | 常用示例优先 |
| 看 diff | `git diff` | `delta` | 彩色、并排 diff |
| 管 Git | 多条 git 命令 | `lazygit` | 终端 Git UI |
| 管 Node | `nvm` | `fnm` | 快速 Node 版本管理 |
| 终端复用 | `tmux` | `zellij` | 多面板、多会话 |

## 推荐安装

Debian/Ubuntu 仓库中可能不是最新版本，但适合快速体验：

```bash
apt update
apt install -y bat fd-find ripgrep fzf btop jq tldr
```

部分发行版会把命令命名为 `batcat`、`fdfind`。可以按习惯创建软链接：

```bash
ln -sf "$(command -v batcat)" /usr/local/bin/bat
ln -sf "$(command -v fdfind)" /usr/local/bin/fd
```

`eza`、`delta`、`lazygit`、`fnm`、`zellij` 建议按各自官方安装方式获取新版。

## 看文件：bat

```bash
# 查看文件，自动语法高亮
bat ~/.zshrc

# 显示行号
bat -n ~/.zshrc

# 不使用分页器，适合脚本或管道
bat --paging=never ~/.zshrc

# 只输出内容，不显示边框和装饰
bat -p ~/.zshrc
```

常用组合：

```bash
rg -n "PermitRootLogin" /etc/ssh | cut -d: -f1 | head -1 | xargs bat
```

## 看目录：eza

```bash
# 普通列表
eza

# 隐藏文件 + 详细信息
eza -la

# 显示图标
eza --icons

# 显示 Git 状态
eza -la --git

# 树形目录，限制两层
eza --tree -L 2
```

最常用：

```bash
alias ll='eza -la --git --icons'
alias tree2='eza --tree -L 2 --icons'
```

## 找文件：fd

```bash
# 查找文件名包含 config 的文件
fd config

# 只找 Markdown
fd -e md

# 在指定目录中查找
fd nginx /etc

# 只找目录
fd -t d src

# 只找文件
fd -t f package
```

常用组合：

```bash
fd -e md | fzf
fd docker docs/src
```

## 搜内容：ripgrep

`ripgrep` 的命令是 `rg`。

```bash
# 当前目录全文搜索
rg "TODO"

# 显示行号
rg -n "useEffect"

# 只搜索 Markdown
rg -t md "Docker"

# 忽略大小写
rg -i "error"

# 包含隐藏文件
rg --hidden "VITEPRESS"

# 显示上下文
rg -n -C 2 "updateTime"
```

排查配置时很好用：

```bash
rg -n "PasswordAuthentication|PermitRootLogin" /etc/ssh
```

## 模糊选择：fzf

```bash
# 从文件列表中选择
fd . | fzf

# 搜索历史命令
history | fzf

# 选择 Git 分支
git branch --all | fzf

# 选择进程
ps -ef | fzf
```

常用快捷键通常包括：

| 快捷键 | 作用 |
| --- | --- |
| `Ctrl+R` | 搜索历史命令 |
| `Ctrl+T` | 模糊插入文件路径 |
| `Alt+C` | 模糊切换目录 |

具体是否生效取决于 shell 集成是否安装。

## 看资源：btop

```bash
btop
```

常见操作：

| 按键 | 作用 |
| --- | --- |
| `f` | 过滤进程 |
| 方向键 | 切换区域 |
| `ESC` | 返回 |
| `q` | 退出 |

机器卡顿时，先用 `btop` 看 CPU、内存、磁盘和高占用进程，再决定是否继续看日志。

## 跳目录：zoxide

初始化，以 Zsh 为例：

```bash
eval "$(zoxide init zsh)"
```

使用：

```bash
# 跳到历史中最匹配的目录
z blog

# 交互式选择
zi
```

刚安装时它还没有学习记录。使用一段时间后，`z project` 这类命令会越来越准。

## 处理 JSON：jq

```bash
# 格式化 JSON
cat data.json | jq

# 读取字段
cat data.json | jq '.name'

# 读取嵌套字段
cat data.json | jq '.user.name'

# 遍历数组
cat data.json | jq '.items[]'

# 输出原始字符串
cat data.json | jq -r '.version'
```

API 调试常用：

```bash
curl -s https://api.github.com/repos/jqlang/jq | jq '.stargazers_count'
```

## 查命令示例：tldr

```bash
tldr tar
tldr curl
tldr ssh
tldr docker
```

更新缓存：

```bash
tldr -u
```

参数复杂的命令，先看 `tldr` 通常比翻完整 `man` 更快。

## Git diff：delta

单次使用：

```bash
git -c core.pager=delta diff
git -c core.pager=delta show HEAD
```

设为默认：

```bash
git config --global core.pager delta
git config --global interactive.diffFilter "delta --color-only"
git config --global delta.navigate true
git config --global delta.side-by-side true
```

常用场景：

```bash
git diff
git show HEAD
git log -p
```

## Git UI：lazygit

```bash
# 当前仓库启动
lazygit

# 指定目录启动
lazygit -p ~/code/my-project
```

常用按键：

| 按键 | 作用 |
| --- | --- |
| `q` | 退出 |
| `space` | 暂存或取消暂存 |
| `c` | 提交 |
| `P` | Push |
| `p` | Pull |
| `b` | 分支面板 |
| `l` | 日志面板 |

它很适合快速查看变更、拆分暂存、切分支和看提交记录。

## Node 版本：fnm

```bash
# 当前版本
fnm current

# 已安装版本
fnm list

# 安装最新 LTS
fnm install --lts

# 安装指定大版本
fnm install 22

# 切换版本
fnm use 22

# 设置默认版本
fnm default 22
```

Zsh 初始化：

```bash
eval "$(fnm env --use-on-cd --shell zsh)"
```

项目里有 `.node-version` 时，`--use-on-cd` 可以在进入目录后自动切换 Node 版本。

## 终端复用：Zellij

```bash
# 启动
zellij

# 查看会话
zellij ls

# 附加到最近会话
zellij a

# 附加指定会话
zellij attach my-session

# 关闭所有会话
zellij kill-all-sessions
```

常用按键：

| 快捷键 | 作用 |
| --- | --- |
| `Ctrl+p` | 面板模式 |
| `Ctrl+q` | 退出当前模式 |
| `Alt+n` | 新建面板 |
| `Alt+h/j/k/l` | 切换面板 |

远程服务器上同时跑服务、看日志、编辑文件时，Zellij 很顺手。

## 一套日常组合

```bash
# 1. 看目录
eza -la --git

# 2. 找文件
fd vitepress docs

# 3. 搜内容
rg -n "updateTime" docs/src

# 4. 打开文件
bat docs/src/index.md

# 5. 处理接口返回
curl -s https://api.github.com/repos/jqlang/jq | jq '.stargazers_count'
```

再配合 `fzf` 和 `zoxide`：

```bash
cd "$(fd -t d . ~/code | fzf)"
z blogs
```

## 最小记忆清单

不想一次记太多，就先记这些：

```bash
bat file
eza -la
eza --tree -L 2
fd keyword
rg -n keyword
fd . | fzf
z project
jq '.field'
tldr tar
git -c core.pager=delta diff
lazygit
fnm install --lts
zellij a
```

先让这些命令进入肌肉记忆，再慢慢扩展别名和 Shell 集成。终端效率真正提升，往往来自每天少敲一点、少找一点、少猜一点。
