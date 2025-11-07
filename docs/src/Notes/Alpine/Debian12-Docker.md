---
title: "🐧 Debian 12 Docker 指南"
outline: deep
desc: "Debian 12 下快速部署 Docker Engine 与 Docker Compose 的操作手册"
tags: "Debian/Docker"
updateTime: "2025-11-06 14:53:16"
---

# 🐧 Debian 12 Docker 指南

::: warning 操作权限

本文默认在 **root 用户** 下执行所有命令；若使用普通用户，请在需要的命令前补充 `sudo` 并确保拥有相应权限。

:::

## 系统准备

::: tip 基础环境更新

确保系统库为最新，避免旧版本依赖阻塞 Docker 安装：

```bash
apt update && apt upgrade -y
apt install -y ca-certificates curl gnupg lsb-release
```

:::

## 添加 Docker 官方软件源

::: warning 注意

若之前安装过社区版本 Docker，请先执行 `apt remove docker docker-engine docker.io containerd runc` 彻底清理。

:::

```bash
# 导入官方 GPG 密钥
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# 配置仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
```

## 🐳 安装 Docker Engine

::: details 安装核心组件

```bash
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 启动并设置开机自启
systemctl enable --now docker

# 验证版本与运行状态
docker --version
systemctl status docker
```

:::

::: tip 配置非 root 用户使用 Docker

如需让普通用户直接运行 Docker，请将其加入 `docker` 用户组：

```bash
TARGET_USER="your_username"
usermod -aG docker "$TARGET_USER"
su - "$TARGET_USER"
docker info  # 以目标用户验证权限
```

:::

## 📦 Docker Compose 安装

::: tip 推荐方案

Debian 12 已内置 Compose 插件，通过 `docker compose` 命令调用，功能等价于独立版：

```bash
docker compose version
```

:::

::: details 可选：安装独立二进制

若需要固定版本或离线环境，可手动下载：

```bash
DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
mkdir -p $DOCKER_CONFIG/cli-plugins
curl -SL https://github.com/docker/compose/releases/download/v2.24.7/docker-compose-linux-x86_64 \
  -o $DOCKER_CONFIG/cli-plugins/docker-compose
chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
docker compose version
```

:::

## 🚀 快速验证

```bash
# 运行 hello-world 容器验证引擎
docker run --rm hello-world

# 创建示例 compose 应用
mkdir -p ~/compose-demo && cd ~/compose-demo
cat <<'EOF' > docker-compose.yml
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
EOF

docker compose up -d
docker compose ps
docker compose down
```

## 常用维护操作

::: tip 服务管理

```bash
# 服务控制
systemctl restart docker
systemctl stop docker

# 清理无用资源
docker system prune -f

# 查看日志
journalctl -u docker --since "10 minutes ago"
```

:::

::: warning 升级注意事项

- 升级前备份关键数据卷与 compose 配置。
- 生产环境建议锁定主版本，先在测试环境验证再更新。
- 若启用了镜像加速器，升级后需确认 `/etc/docker/daemon.json` 仍然有效。

:::
