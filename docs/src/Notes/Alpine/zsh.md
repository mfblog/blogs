---
title: "⌨️ Zsh & Tmux 环境全攻略"
outline: deep
desc: "本文将介绍oh-my-zsh配置备份及还原"
tags: "zsh/Tmux"
updateTime: "2025-04-18 14:56:32"
---



# 环境准备

首先更新软件包列表并安装必要工具：Zsh、Git、Curl、Wget 以及 Tmux。

```bash
apt update
```
```bash
apt install -y zsh git curl wget tmux dnsutils net-tools fuse libfuse2 -y
```

# 配置 Zsh 环境

使用 `tee` 命令创建并写入环境变量配置文件：

```bash
tee "$HOME/.zshenv" >/dev/null 2>&1 << 'EOF'
# XDG 目录规范
export XDG_CONFIG_HOME="$HOME/.config"
export XDG_DATA_HOME="$HOME/.local/share"
export XDG_CACHE_HOME="$HOME/.cache"

# Zsh 相关配置
export ZDOTDIR="$XDG_CONFIG_HOME/zsh"
export HISTFILE="$ZDOTDIR/.zhistory"
export HISTSIZE=10000
export SAVEHIST=10000

# Zim（Zsh 配置管理器）安装路径
export ZIM_HOME="$XDG_DATA_HOME/zim"
EOF
```

# 立即生效
```bash
source "$HOME/.zshenv"
```

# 克隆并应用 Zsh 配置：

```bash
git clone https://github.com/LittleNewton/zsh-config.git ~/.config/zsh
```
## 首次运行会自动安装依赖
```bash
zsh
```
## 随后执行下列命令安装所需的软件
```bash
ltnt_install all
```

# 安装并链接 NeoVim

```bash
ln -sf /usr/local/bin/nvim.appimage /usr/local/bin/nvim
chmod +x /usr/local/bin/nvim
```

# 克隆常用工具配置

```bash
cd $HOME
GITHUB="https://github.com/LittleNewton"
git clone ${GITHUB}/joshuto-config        ~/.config/joshuto
git clone ${GITHUB}/lazygit-config        ~/.config/lazygit
git clone ${GITHUB}/tmux-config           ~/.config/tmux
git clone ${GITHUB}/tmux-powerline-config ~/.config/tmux-powerline
git clone ${GITHUB}/btop-config.git       ~/.config/btop
```

# Tmux 快捷键与窗口管理

## 安装插件
- **创建新会话**：`tmux new -s session`
- **安装插件**：`Ctrl + b` 然后按 `Shift + i`
## 会话管理

- **创建新会话**：`tmux new -s session`
- **列出会话**：`tmux ls`
- **重命名会话**：`tmux rename-session -t old_name new_name`

## 窗口操作

- **新建窗口**：`Ctrl + b` 然后按 `c`
- **切换窗口**：`Ctrl + b` → 数字键（如 `0` 切换到第 0 号窗口）
- **重命名窗口**：`Ctrl + b` → `,` → 输入名称

## 面板分屏

- **水平分屏**：`Ctrl + b` → `"`
- **垂直分屏**：`Ctrl + b` → `%`
- **切换面板**：`Ctrl + b` → 方向键（←↑→↓）
- **关闭面板**：`Ctrl + b` → `x` 或输入 `exit`

## 快捷键帮助

按 `Ctrl + b` → `?` 可查看所有快捷键，按 `q` 退出帮助界面。

---
