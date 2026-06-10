---
title: "📄 Alpine 笔记"
outline: deep
desc: "Alpine Linux 初始化、OpenRC 服务管理、SSH 与 Docker 部署速查"
tags: "Alpine/Docker"
updateTime: "2024-12-11 08:06:32"
---

# 📄 Alpine 笔记

Alpine Linux 体积小、启动快，适合云主机、容器宿主机和边缘节点。它和 Debian/Ubuntu 最大的差异在于包管理器使用 `apk`，服务管理使用 OpenRC。

这篇笔记整理一台 Alpine 新机器最常用的初始化动作：基础工具、服务管理、SSH 配置和 Docker 安装。

::: warning 操作前提醒

本文默认以 `root` 用户执行命令。生产环境不要长期开放 `root` 密码登录，完成初始化后建议改为普通用户加 SSH 密钥登录。

:::

## 基础工具安装

先更新索引，再安装远程登录、编辑器、Shell、网络排障和常用下载工具。

```bash
apk update
apk add openssh vim bash util-linux bash-doc bash-completion curl wget net-tools
```

常用组件说明：

| 包名 | 用途 |
| --- | --- |
| `openssh` | SSH 服务端与客户端工具 |
| `vim` | 终端编辑器 |
| `bash` | 兼容多数脚本的 Shell |
| `util-linux` | 提供 `lsblk`、`mount` 等系统工具 |
| `curl` / `wget` | 下载文件、测试接口 |
| `net-tools` | 提供 `netstat`、`ifconfig` 等传统网络工具 |

## OpenRC 服务管理

Alpine 默认不使用 systemd，而是使用 OpenRC。记住下面几组命令，基本就能完成日常管理。

```bash
# 启动、重启、查看服务
rc-service sshd start
rc-service sshd restart
rc-service sshd status

# 设置开机自启
rc-update add sshd default

# 移除开机自启
rc-update del sshd default

# 查看所有服务状态
rc-status -a
```

::: tip 常见服务名

- SSH 服务通常是 `sshd`。
- Docker 服务通常是 `docker`。
- 自定义脚本放在 `/etc/init.d/` 后，文件名就是服务名。

:::

## SSH 服务配置

安装并启动 SSH 服务：

```bash
apk add openssh-server
rc-service sshd start
rc-update add sshd default
```

如果只是临时测试，可以允许 `root` 登录：

```bash
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config
rc-service sshd restart
```

::: danger 生产环境建议

测试完成后，建议改为密钥登录，并禁用密码登录：

```ini
PermitRootLogin prohibit-password
PasswordAuthentication no
PubkeyAuthentication yes
```

修改后先保留一个已登录的 SSH 会话，再开新窗口测试密钥登录，确认无误后再关闭旧会话。

:::

## Docker 安装

启用 community 仓库后安装 Docker：

```bash
sed -i '/community/s/^#//' /etc/apk/repositories
apk update
apk add docker docker-cli-compose
```

启动服务并设置开机自启：

```bash
rc-service docker start
rc-update add docker boot
docker version
docker compose version
```

## 镜像加速配置

如果服务器访问 Docker Hub 较慢，可以配置镜像加速源。请把示例地址替换成自己的可用镜像源。

```bash
mkdir -p /etc/docker
cat >/etc/docker/daemon.json <<'EOF'
{
  "registry-mirrors": [
    "https://<your-registry-mirror>"
  ]
}
EOF

rc-service docker restart
```

验证配置是否生效：

```bash
docker info | grep -A 5 "Registry Mirrors"
docker run --rm alpine uname -a
```

## 维护清单

- `apk update && apk upgrade`：更新系统包。
- `rc-status -a`：确认关键服务状态。
- `df -h`：检查磁盘空间。
- `docker system df`：查看 Docker 镜像、容器和卷占用。
- `journalctl` 不适用于默认 Alpine，服务日志通常需要看具体程序输出或 `/var/log/`。

Alpine 的核心优势是轻量，但也意味着很多工具默认没有预装。遇到命令不存在时，优先用 `apk search <关键词>` 查找对应包名。
