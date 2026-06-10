---
title: "🐧 Debian 12 Docker 指南"
outline: deep
desc: "Debian 12 下安装 Docker Engine、Compose 插件、镜像源与常用维护命令"
tags: "Debian/Docker"
updateTime: "2025-11-06 14:53:16"
---

# 🐧 Debian 12 Docker 指南

这篇文章记录 Debian 12 上安装 Docker Engine 和 Docker Compose 插件的标准流程，并补充镜像源、普通用户权限、验证和维护命令。

::: warning 权限说明

本文默认以 `root` 用户执行。普通用户请在命令前加 `sudo`，并确认自己拥有系统管理权限。

:::

## 安装前准备

更新系统并安装仓库依赖：

```bash
apt update
apt upgrade -y
apt install -y ca-certificates curl gnupg lsb-release
```

如果曾经安装过 Debian 仓库中的旧版 Docker，可以先清理旧包：

```bash
apt remove -y docker docker-engine docker.io containerd runc || true
```

::: tip 数据不会自动删除

上面的命令通常只移除软件包，不会主动删除 `/var/lib/docker`。如果机器上已有重要容器数据，升级或重装前仍建议先备份。

:::

## 添加 Docker 官方软件源

创建 keyrings 目录并导入 GPG 密钥：

```bash
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
```

写入 Docker 官方仓库：

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  >/etc/apt/sources.list.d/docker.list

apt update
```

## 安装 Docker Engine

```bash
apt install -y \
  docker-ce \
  docker-ce-cli \
  containerd.io \
  docker-buildx-plugin \
  docker-compose-plugin
```

启动并设置开机自启：

```bash
systemctl enable --now docker
```

验证：

```bash
docker --version
docker compose version
systemctl status docker --no-pager
```

## 允许普通用户使用 Docker

如果不想每次都使用 `sudo docker`，可以把用户加入 `docker` 组：

```bash
TARGET_USER="your_username"
usermod -aG docker "$TARGET_USER"
```

重新登录该用户后验证：

```bash
docker info
```

::: danger 权限风险

`docker` 组成员几乎等同于拥有 root 权限。只给可信用户加入该组，不要把它当作普通应用权限。

:::

## 配置镜像源

网络环境较慢时，可以配置可用的镜像加速源。请替换为自己维护或可信的镜像地址。

```bash
mkdir -p /etc/docker
tee /etc/docker/daemon.json >/dev/null <<'EOF'
{
  "registry-mirrors": [
    "https://<your-registry-mirror>"
  ]
}
EOF

systemctl restart docker
```

验证：

```bash
docker info | grep -A 5 "Registry Mirrors"
```

## 快速运行测试

```bash
docker run --rm hello-world
```

创建一个 Compose 示例：

```bash
mkdir -p ~/compose-demo
cd ~/compose-demo

tee docker-compose.yml >/dev/null <<'EOF'
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

## 常用维护命令

```bash
# 查看 Docker 占用
docker system df

# 清理未使用的镜像、容器、网络和构建缓存
docker system prune -f

# 查看服务日志
journalctl -u docker --since "30 minutes ago" --no-pager

# 重启 Docker
systemctl restart docker
```

如果要清理未使用的数据卷，需要额外确认：

```bash
docker volume ls
docker system prune --volumes
```

::: warning 卷清理提醒

数据卷可能保存数据库、上传文件或业务状态。执行 `--volumes` 前一定要确认没有误删风险。

:::

## 升级建议

- 生产环境升级前备份 Compose 文件、环境变量和关键数据卷。
- 先在测试机验证镜像、网络、存储驱动是否正常。
- 升级后检查 `docker info`、`docker compose version` 和业务容器日志。
- 如果使用代理或镜像源，确认 `/etc/docker/daemon.json` 与 systemd drop-in 仍然有效。
