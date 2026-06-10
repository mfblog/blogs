---
title: "⌨️ Oh My Zsh 配置指南"
outline: deep
desc: "Zsh、Oh My Zsh、Powerlevel10k、常用插件与配置备份还原流程"
tags: "zsh/oh-my-zsh"
updateTime: "2025-03-17 11:06:32"
---

# ⌨️ Oh My Zsh 配置指南

Oh My Zsh 适合想快速获得主题、插件和友好提示符的用户。本文整理一套自动化安装脚本思路：识别 Alpine 与 Debian/Ubuntu，安装 Zsh、Oh My Zsh、Powerlevel10k、常用插件、Nerd Font，并还原个人配置。

::: warning 使用前请先阅读

脚本会修改默认 Shell，并覆盖 `~/.zshrc`、`~/.p10k.zsh` 等配置文件。执行前请备份现有配置。

:::

## 资源地址

- 安装脚本：[zsh.sh](https://tyecho-1253296622.cos.ap-beijing-1.myqcloud.com/zsh.sh)
- 配置仓库：[oh-my-zsh-backup](https://github.com/mfblog/oh-my-zsh-backup)

## 脚本做了什么

| 步骤 | 说明 |
| --- | --- |
| 系统识别 | 根据 `/etc/alpine-release` 判断是否为 Alpine |
| 依赖安装 | 安装 `zsh`、`git`、`curl`、`wget`、`fontconfig` |
| 默认 Shell | Alpine 修改 `/etc/passwd`，其他系统使用 `chsh` |
| 框架安装 | 安装 Oh My Zsh |
| 主题安装 | 克隆 Powerlevel10k |
| 插件安装 | 克隆 autosuggestions 与 syntax-highlighting |
| 字体安装 | 安装 FiraMono Nerd Font |
| 配置还原 | 从备份仓库复制 `.zshrc`、`.p10k.zsh` 和自定义目录 |

## 安装脚本

```sh {v-pre}
#!/bin/bash
set -euo pipefail

detect_alpine() {
  [ -f /etc/alpine-release ]
}

if detect_alpine; then
  PKG_MGR="apk"
  INSTALL_CMD="add"
  echo "检测到 Alpine 系统，使用 apk 包管理器"
else
  PKG_MGR="apt"
  INSTALL_CMD="install -y"
  echo "检测到非 Alpine 系统，使用 apt 包管理器"
fi

$PKG_MGR update
$PKG_MGR $INSTALL_CMD zsh git curl wget fontconfig

ZSH_PATH="$(command -v zsh)"
CURRENT_USER="$(whoami)"

if detect_alpine; then
  cp /etc/passwd /etc/passwd.bak.$(date +%F-%H%M%S)
  sed -i "/^${CURRENT_USER}:/s|:/bin/[^:]*$|:${ZSH_PATH}|" /etc/passwd
else
  chsh -s "$ZSH_PATH" "$CURRENT_USER"
fi

RUNZSH=no sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

ZSH_CUSTOM="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}"
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git \
  "$ZSH_CUSTOM/themes/powerlevel10k"

for plugin in \
  https://github.com/zsh-users/zsh-autosuggestions.git \
  https://github.com/zsh-users/zsh-syntax-highlighting.git
do
  repo_name="$(basename "$plugin" .git)"
  target_dir="$ZSH_CUSTOM/plugins/$repo_name"
  [ -d "$target_dir" ] || git clone --depth=1 "$plugin" "$target_dir"
done

FONT_DIR="/usr/share/fonts/truetype/nerd-fonts"
mkdir -p "$FONT_DIR"
wget -q -P /tmp https://github.com/ryanoasis/nerd-fonts/raw/master/patched-fonts/FiraMono/Regular/FiraMonoNerdFont-Regular.otf
mv /tmp/FiraMonoNerdFont-Regular.otf "$FONT_DIR/"
chmod 644 "$FONT_DIR/FiraMonoNerdFont-Regular.otf"
fc-cache -fv

BACKUP_DIR="$HOME/oh-my-zsh-backup"
[ -d "$BACKUP_DIR" ] || git clone https://github.com/mfblog/oh-my-zsh-backup.git "$BACKUP_DIR"

cp -v "$BACKUP_DIR/.p10k.zsh" "$HOME/"
cp -v "$BACKUP_DIR/.zshrc" "$HOME/"
mkdir -p "$ZSH_CUSTOM"
cp -vr "$BACKUP_DIR/oh-my-zsh-custom/"* "$ZSH_CUSTOM/"

cat <<EOF

安装完成。

后续操作：
1. 完全退出终端并重新登录。
2. 确认默认 Shell 已变为 Zsh。
3. 如果图标显示异常，在终端软件中选择 FiraMono Nerd Font。
4. 首次启动 Powerlevel10k 时，按提示完成样式配置。
EOF
```

## 手动验证

```bash
echo "$SHELL"
zsh --version
ls ~/.oh-my-zsh
ls ~/.oh-my-zsh/custom/themes/powerlevel10k
```

检查插件目录：

```bash
ls ~/.oh-my-zsh/custom/plugins
```

检查字体：

```bash
fc-list | grep -i "FiraMono"
```

## 常见问题

### 图标显示为方块

终端软件没有使用 Nerd Font。需要在本地终端设置中选择 `FiraMono Nerd Font` 或其他 Nerd Font。

### 重新登录后仍不是 Zsh

```bash
grep "^$(whoami):" /etc/passwd
which zsh
```

Debian/Ubuntu 可重新执行：

```bash
chsh -s "$(which zsh)" "$USER"
```

### GitHub 下载失败

确认网络连通性，或给 Git/curl 配置代理后重试：

```bash
git ls-remote https://github.com/ohmyzsh/ohmyzsh.git >/dev/null
```

## 维护建议

- `.zshrc`、`.p10k.zsh`、自定义插件和主题建议放入自己的配置仓库。
- 自动脚本适合新机器初始化，已有复杂配置的机器建议手动合并。
- 修改默认 Shell 前，保留一个可用的 SSH 会话，避免配置错误导致登录困难。
