---
title: "⌨️ Nvim && Lvim 安装指南"
outline: deep
desc: "Neovim 与 LunarVim 在 Linux 服务器上的安装、PATH 配置与插件同步流程"
tags: "Nvim/Lvim"
updateTime: "2025-03-25 15:51:33"
---

# ⌨️ Nvim && Lvim 安装指南

Neovim 是现代终端编辑器，LunarVim 则是在 Neovim 之上封装的一套开箱即用配置。本文适合在 Debian/Ubuntu 服务器或开发机上快速部署一套可用的终端编辑环境。

::: warning 适用说明

命令默认使用 `bash` 或 `zsh`。如果你使用的是普通用户，请确认 `/opt`、`/usr/local/bin` 等路径有写入权限，必要时在命令前加 `sudo`。

:::

## 安装依赖

```bash
apt update
apt install -y curl git tar gzip build-essential
```

LunarVim 还会依赖 Node.js、Python、Rust 等生态工具，安装器会按提示检查。你也可以先配置好自己的开发环境后再安装。

## 安装 Neovim

下载 Linux x86_64 预编译包：

```bash
curl -LO https://github.com/neovim/neovim/releases/latest/download/nvim-linux-x86_64.tar.gz
```

解压到 `/opt`：

```bash
rm -rf /opt/nvim-linux-x86_64
tar -C /opt -xzf nvim-linux-x86_64.tar.gz
```

创建命令软链接：

```bash
ln -sf /opt/nvim-linux-x86_64/bin/nvim /usr/local/bin/nvim
nvim --version
```

## 配置 PATH

如果你不想创建软链接，也可以把 Neovim 目录写入 Shell 配置。

Zsh：

```bash
echo 'export PATH="/opt/nvim-linux-x86_64/bin:$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Bash：

```bash
echo 'export PATH="/opt/nvim-linux-x86_64/bin:$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

验证：

```bash
which nvim
nvim --version
```

## 安装 LunarVim

执行官方安装脚本：

```bash
bash <(curl -s https://raw.githubusercontent.com/lunarvim/lunarvim/master/utils/installer/install.sh)
```

安装过程中遇到确认提示时，根据自己的环境选择即可。个人开发机通常可以接受默认选项；服务器环境建议先读清楚它要安装或修改的内容。

安装完成后，确认 `lvim` 命令可用：

```bash
which lvim
lvim --version
```

如果命令不存在，通常是 `$HOME/.local/bin` 没有加入 PATH。重新执行上面的 PATH 配置即可。

## 同步插件

进入 LunarVim：

```bash
lvim
```

在编辑器中执行：

```vim
:Lazy sync
```

同步完成后重启 `lvim`。

## 常见问题

### `nvim` 版本过低

优先确认执行的是哪个二进制：

```bash
which nvim
nvim --version
```

如果系统仓库旧版 Neovim 优先级更高，可以调整 PATH 顺序，或保留 `/usr/local/bin/nvim` 软链接。

### `lvim` 命令找不到

```bash
ls -l ~/.local/bin/lvim
echo "$PATH"
```

把用户本地二进制目录加入 Shell 配置：

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### 插件下载失败

检查 GitHub 连通性：

```bash
git ls-remote https://github.com/LunarVim/LunarVim.git >/dev/null
```

如果网络不稳定，优先配置 Git 代理或换到网络更好的环境再同步插件。

## 升级与清理

升级 Neovim 时，重复下载并解压新版压缩包即可。升级前可以先查看当前版本：

```bash
nvim --version | head -1
```

LunarVim 配置通常位于：

```text
~/.config/lvim
~/.local/share/lunarvim
~/.cache/lvim
```

清理或重装前，先备份自己的配置文件。
