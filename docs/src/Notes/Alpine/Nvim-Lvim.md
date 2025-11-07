---
title: "⌨️ Nvim && Lvim 安装指南"
outline: deep
desc: "本文将介绍Nvim && Lvim 安装方法"
tags: "Nvim/Lvim"
updateTime: "2025-03-25 15:51:33"
---

# ⌨️ Nvim && Lvim 安装指南

## Neovim 与 LunarVim 安装配置指南

## 下载并解压 Neovim 最新版本

```bash
curl -LO https://github.com/neovim/neovim/releases/latest/download/nvim-linux-x86_64.tar.gz
```

```bash
rm -rf /opt/nvim
```

```bash
tar -C /opt -xzf nvim-linux-x86_64.tar.gz
```

## 配置环境变量

```bash
echo 'export PATH="$PATH:/opt/nvim-linux-x86_64/bin"' >> ~/.zshrc
```

```bash
source ~/.zshrc
```

::: tip 注意

此步骤仅为临时配置，后续安装 LunarVim 时会优化路径。

:::

## 安装 LunarVim

```bash
bash <(curl -s https://raw.githubusercontent.com/lunarvim/lunarvim/master/utils/installer/install.sh)
```

::: tip 注意

如果提示yes or on 一路回车就可以了

:::

## 优化环境变量配置

### 移除临时添加的 Neovim 路径

```bash
sed -i '/export PATH="\$PATH:\/opt\/nvim-linux-x86_64\/bin"/d' ~/.zshrc
```

### 添加永久环境变量（包含 Neovim 和用户本地二进制目录）

```bash
echo 'export PATH="$PATH:/opt/nvim-linux-x86_64/bin:/root/.local/bin"' >> ~/.zshrc
```

::: warning 重要

修改后需执行 source ~/.zshrc 或重新登录使配置生效。

:::

## 同步插件配置

### 在 Neovim 中执行插件同步命令

```bash
:Lazy sync
```
