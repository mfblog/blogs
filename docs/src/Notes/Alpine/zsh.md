---
title: "⌨️ Zsh & Tmux 环境全攻略"
outline: deep
desc: "基于 XDG 目录规范配置 Zsh、Zim、Tmux、LunarVim 与常用终端工具"
tags: "zsh/Tmux"
updateTime: "2025-04-18 14:56:32"
---

# ⌨️ Zsh & Tmux 环境全攻略

这篇笔记记录一套偏“重度终端用户”的环境初始化方式：用 Zsh 作为默认 Shell，用 XDG 目录规范整理配置，再配合 Tmux、LunarVim、lazygit、btop 等工具形成远程服务器上的完整工作台。

::: warning 使用前说明

文中部分配置仓库来自个人仓库，适合复用自己的工作流。直接套用前建议先浏览仓库内容，确认快捷键、别名和插件符合自己的习惯。

:::

## 安装基础依赖

```bash
apt update
apt install -y \
  zsh \
  git \
  curl \
  wget \
  tmux \
  dnsutils \
  net-tools \
  fuse \
  libfuse2 \
  make \
  build-essential
```

确认 Zsh 路径：

```bash
which zsh
```

## 设置 XDG 与 Zsh 环境变量

创建 `~/.zshenv`，让 Zsh 从统一目录读取配置：

```bash
tee "$HOME/.zshenv" >/dev/null <<'EOF'
# XDG 目录规范
export XDG_CONFIG_HOME="$HOME/.config"
export XDG_DATA_HOME="$HOME/.local/share"
export XDG_CACHE_HOME="$HOME/.cache"

# Zsh 配置位置
export ZDOTDIR="$XDG_CONFIG_HOME/zsh"
export HISTFILE="$ZDOTDIR/.zhistory"
export HISTSIZE=10000
export SAVEHIST=10000

# Zim 安装位置
export ZIM_HOME="$XDG_DATA_HOME/zim"

# 用户本地命令
export PATH="$HOME/.local/bin:$PATH"
EOF
```

立即加载：

```bash
source "$HOME/.zshenv"
mkdir -p "$ZDOTDIR"
```

## 克隆 Zsh 配置

```bash
git clone https://github.com/LittleNewton/zsh-config.git ~/.config/zsh
```

首次进入 Zsh：

```bash
zsh
```

如果配置中提供了安装函数，可以继续执行：

```bash
ltnt_install all
```

::: tip 排障思路

如果首次进入 Zsh 报错，先检查 `~/.zshenv` 中的 `ZDOTDIR` 是否正确，再确认 `~/.config/zsh/.zshrc` 是否存在。

:::

## 切换默认 Shell

确认 Zsh 可用后再切换默认 Shell：

```bash
chsh -s "$(which zsh)" "$USER"
```

重新登录后验证：

```bash
echo "$SHELL"
```

## 安装 Neovim 与 LunarVim

如果已经下载了 Neovim AppImage，可以建立软链接：

```bash
ln -sf /usr/local/bin/nvim.appimage /usr/local/bin/nvim
chmod +x /usr/local/bin/nvim
nvim --version
```

安装 LunarVim：

```bash
bash <(curl -s https://raw.githubusercontent.com/lunarvim/lunarvim/master/utils/installer/install.sh)
```

进入编辑器后同步插件：

```vim
:Lazy sync
```

## 克隆常用工具配置

```bash
cd "$HOME"
GITHUB="https://github.com/LittleNewton"

git clone "${GITHUB}/joshuto-config"        ~/.config/joshuto
git clone "${GITHUB}/lazygit-config"        ~/.config/lazygit
git clone "${GITHUB}/tmux-config"           ~/.config/tmux
git clone "${GITHUB}/tmux-powerline-config" ~/.config/tmux-powerline
git clone "${GITHUB}/btop-config.git"       ~/.config/btop
```

如果目标目录已存在，先备份自己的配置，再决定是否覆盖。

## Tmux 基础操作

创建新会话：

```bash
tmux new -s work
```

常用命令：

```bash
# 查看会话
tmux ls

# 重新连接会话
tmux attach -t work

# 重命名会话
tmux rename-session -t old_name new_name
```

默认快捷键：

| 操作 | 快捷键 |
| --- | --- |
| 新建窗口 | `Ctrl+b` 后按 `c` |
| 切换窗口 | `Ctrl+b` 后按数字键 |
| 重命名窗口 | `Ctrl+b` 后按 `,` |
| 水平分屏 | `Ctrl+b` 后按 `"` |
| 垂直分屏 | `Ctrl+b` 后按 `%` |
| 切换面板 | `Ctrl+b` 后按方向键 |
| 关闭面板 | `Ctrl+b` 后按 `x` |
| 查看帮助 | `Ctrl+b` 后按 `?` |

安装 Tmux 插件通常使用：

```text
Ctrl+b 然后按 Shift+i
```

## 维护建议

- 自定义配置先进入 Git 仓库管理，避免换机器时丢失。
- 修改 `~/.zshenv` 后重新登录一次，确认非交互 Shell 没有异常。
- Tmux、Zsh、编辑器配置仓库尽量分开，排障时更容易定位。
- 远程服务器上保留一个基础 Shell 入口，避免 Zsh 配置写错后无法登录。
