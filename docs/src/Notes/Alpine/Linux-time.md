---
title: "🐧 中文环境、时区同步与 SSH 安全加固"
outline: deep
desc: "Debian/Ubuntu 服务器中文 locale、Asia/Shanghai 时区与 SSH 密钥登录加固流程"
tags: "Linux/服务器/SSH/安全/中文环境/教程"
updateTime: "2025-08-21 09:06:32"
---

# 🐧 中文环境、时区同步与 SSH 安全加固

新服务器上线后，最先应该处理三件小事：中文显示、系统时区和远程登录安全。它们看起来基础，但会直接影响日志排查、定时任务、应用渲染和服务器暴露面。

本文以 Debian/Ubuntu 为例，默认使用 `apt`、`systemd` 和 OpenSSH。

::: warning 操作前准备

SSH 加固前，请确认你已经能使用密钥登录服务器。修改 SSH 配置时，建议保留当前已连接的窗口，再打开一个新窗口验证登录，避免把自己锁在服务器外。

:::

## 安装中文语言与字体

```bash
apt update
apt install -y locales locales-all fonts-wqy-zenhei fonts-wqy-microhei
```

各组件用途：

| 组件 | 作用 |
| --- | --- |
| `locales` | 管理系统语言环境 |
| `locales-all` | 提供完整 locale 数据，减少缺失问题 |
| `fonts-wqy-zenhei` | 文泉驿正黑，适合中文显示 |
| `fonts-wqy-microhei` | 文泉驿微米黑，常用于网页和轻量环境 |

## 设置默认 Locale

运行交互式配置：

```bash
dpkg-reconfigure locales
```

在列表中勾选：

```text
zh_CN.UTF-8 UTF-8
```

随后将默认 locale 设置为：

```text
zh_CN.UTF-8
```

验证：

```bash
locale
```

如果某些非交互环境仍未生效，可以写入 `/etc/default/locale`：

```bash
tee /etc/default/locale >/dev/null <<'EOF'
LANG=zh_CN.UTF-8
LANGUAGE=zh_CN:zh
LC_ALL=zh_CN.UTF-8
EOF
```

重新登录后再检查一次。

## 设置中国标准时间

将系统时区设置为 `Asia/Shanghai`：

```bash
timedatectl set-timezone Asia/Shanghai
timedatectl
date
```

如果启用了 NTP，`timedatectl` 中通常会看到 `System clock synchronized: yes`。如果未同步，可启用系统默认时间同步服务：

```bash
timedatectl set-ntp true
```

::: tip 为什么要设置时区

日志、Cron、证书续签、备份脚本都会依赖系统时间。时区不统一时，排障时很容易误判事件发生顺序。

:::

## 配置 SSH 密钥登录

先在本地生成或确认已有密钥：

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

将公钥写入服务器用户的 `authorized_keys`：

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
vim ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

也可以在本地使用：

```bash
ssh-copy-id user@server_ip
```

## 禁用密码登录

编辑 SSH 服务端配置：

```bash
vim /etc/ssh/sshd_config
```

推荐配置：

```ini
PubkeyAuthentication yes
PasswordAuthentication no
PermitRootLogin prohibit-password
```

配置含义：

- `PubkeyAuthentication yes`：允许公钥认证。
- `PasswordAuthentication no`：禁止所有用户使用密码登录。
- `PermitRootLogin prohibit-password`：允许 `root` 使用密钥登录，但禁止 `root` 密码登录。

先检查配置语法：

```bash
sshd -t
```

确认无输出后重启服务：

```bash
systemctl restart ssh
```

部分系统服务名可能是 `sshd`：

```bash
systemctl restart sshd
```

## 验证与回滚

验证密钥登录：

```bash
ssh user@server_ip
```

验证密码登录是否被拒绝：

```bash
ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no user@server_ip
```

如果新窗口无法登录，不要关闭旧窗口。立即回到旧窗口恢复：

```ini
PasswordAuthentication yes
```

然后重启 SSH 服务。

## 初始化检查清单

- `locale` 输出包含 `zh_CN.UTF-8`。
- `date` 显示为预期时区时间。
- `timedatectl` 显示 `Time zone: Asia/Shanghai`。
- 新 SSH 窗口可以使用密钥登录。
- 密码登录已被拒绝。

完成这些基础项后，服务器的日志、显示和远程访问会更可控，后续部署 Docker、Nginx、数据库或业务服务也更稳。
