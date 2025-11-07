---
title: "⌨️ Oh My Zsh 配置指南"
outline: deep
desc: "本文将介绍oh-my-zsh配置备份及还原"
tags: "zsh/oh-my-zsh"
updateTime: "2025-03-17 11:06:32"
---

# ⌨️ Oh My Zsh 配置指南

## Zsh && Oh My Zsh 安装指南

## 📥 下载地址

[点击下载 zsh.sh](https://tyecho-1253296622.cos.ap-beijing-1.myqcloud.com/zsh.sh)

## 📦 Github 仓库

[oh-my-zsh-backup](https://github.com/mfblog/oh-my-zsh-backup)

## 🖥️ 安装脚本

```sh {v-pre}
#!/bin/bash
set -e  # 遇到错误立即退出

# 检测 Alpine 系统
detect_alpine() {
  if [ -f /etc/alpine-release ]; then
    return 0
  else
    return 1
  fi
}

# 选择包管理器
if detect_alpine; then
  PKG_MGR="apk"
  INSTALL_CMD="add"
  echo "检测到 Alpine 系统，使用 apk 包管理器"
else
  PKG_MGR="apt"
  INSTALL_CMD="install -y"
  echo "检测到非 Alpine 系统，使用 apt 包管理器"
fi

# 安装依赖
$PKG_MGR update
$PKG_MGR $INSTALL_CMD zsh git curl wget fontconfig

# 切换默认 shell
if detect_alpine; then
  ZSH_PATH=$(which zsh)
  CURRENT_USER=$(whoami)
  sed -i.bak "s|/bin/ash|$ZSH_PATH|g" /etc/passwd
  sed -i "/$CURRENT_USER/s|/bin/sh|$ZSH_PATH|" /etc/passwd
else
  chsh -s "$(which zsh)" "$USER"
fi

# 安装 Oh My Zsh
RUNZSH=no sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" || {
  echo "Oh My Zsh 安装失败，请检查网络连接"
  exit 1
}

# 安装 Powerlevel10k 主题
ZSH_CUSTOM="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}"
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git "$ZSH_CUSTOM/themes/powerlevel10k"

# 安装插件
plugins="https://github.com/zsh-users/zsh-autosuggestions.git https://github.com/zsh-users/zsh-syntax-highlighting.git"
for plugin in $plugins; do
  repo_name=$(basename "$plugin" .git)
  target_dir="$ZSH_CUSTOM/plugins/$repo_name"
  [ ! -d "$target_dir" ] && git clone --depth=1 "$plugin" "$target_dir"
done

# 安装字体
FONT_DIR="/usr/share/fonts/truetype/nerd-fonts"
mkdir -p "$FONT_DIR"
wget -q -P /tmp https://github.com/ryanoasis/nerd-fonts/raw/master/patched-fonts/FiraMono/Regular/FiraMonoNerdFont-Regular.otf
mv /tmp/FiraMonoNerdFont-Regular.otf "$FONT_DIR/"
chmod 644 "$FONT_DIR/FiraMonoNerdFont-Regular.otf"
fc-cache -fv

# 备份并部署配置文件
BACKUP_DIR="$HOME/oh-my-zsh-backup"
[ ! -d "$BACKUP_DIR" ] && git clone https://github.com/mfblog/oh-my-zsh-backup.git "$BACKUP_DIR"

if [ -d "$BACKUP_DIR" ]; then
  cp -v "$BACKUP_DIR/.p10k.zsh" "$HOME/"
  cp -v "$BACKUP_DIR/.zshrc" "$HOME/"
  mkdir -p "$ZSH_CUSTOM"
  cp -vr "$BACKUP_DIR/oh-my-zsh-custom/"* "$ZSH_CUSTOM/"
  echo "✅ 配置文件部署完成"
else
  echo "❌ 错误：备份仓库克隆失败"
  exit 1
fi

# 最终提示
cat <<EOF

🎉 安装完成！请执行以下操作：
1. **完全退出终端**
2. **重新登录系统**
3. **首次启动 Zsh 时，按照提示配置 Powerlevel10k**
4. **若字体显示异常，请手动设置终端字体为 FiraMono Nerd Font**

🚀 祝您使用愉快！
EOF
