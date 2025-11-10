---
title: "🚀 Docker 走 SOCKS5 代理拉取镜像"
outline: deep
desc: "通过镜像加速源 + systemd 环境变量，让 Docker 拉取镜像走 socks5h 代理"
tags: "Docker/Proxy"
updateTime: "2025-11-10 14:46:23"
---

为 Docker 配置 SOCKS5 代理时，需要**同时**改造镜像源与 systemd 环境变量，才能保证 `docker pull`、`docker build` 等所有网络请求都走代理。以下步骤基于 Debian/Ubuntu 系统，其他发行版可按需调整路径。

## ⚙️ 配置镜像加速源

```bash
tee /etc/docker/daemon.json > /dev/null <<'EOF'
{
  "registry-mirrors": [
    "https://hub.mirrorify.net"
  ]
}
EOF
```

> 说明：`registry-mirrors` 用于指定国内或自建镜像源，配合代理可大幅缩短镜像下载耗时。

## 🌐 定义 systemd 代理环境

Docker 作为 systemd 服务运行，所以需要通过 drop-in 方式注入环境变量。

```bash
mkdir -p /etc/systemd/system/docker.service.d

tee /etc/systemd/system/docker.service.d/proxy.conf > /dev/null <<'EOF'
[Service]
Environment="HTTP_PROXY=socks5h://192.168.88.3:8888"
Environment="HTTPS_PROXY=socks5h://192.168.88.3:8888"
Environment="NO_PROXY=localhost,127.0.0.1"
EOF
```

> 使用 `socks5h` 能让域名解析在代理端完成，避免本地 DNS 污染；`NO_PROXY` 保障本地环回地址仍走直连。

## 🔄 重载并验证服务

```bash
systemctl daemon-reexec
systemctl daemon-reload
systemctl restart docker
```

确认代理变量已生效：

```bash
systemctl show --property=Environment docker
docker info | grep -A 5 Proxy
```

预期输出类似：

```bash
Environment=HTTP_PROXY=socks5h://192.168.88.3:8888 HTTPS_PROXY=socks5h://192.168.88.3:8888 NO_PROXY=localhost,127.0.0.1

HTTP Proxy: socks5h://192.168.88.3:8888
HTTPS Proxy: socks5h://192.168.88.3:8888
No Proxy: localhost,127.0.0.1
```

## ✅ 测试镜像拉取

```bash
docker pull alpine
```

若能顺利下载且速度明显提升，说明 SOCKS5 代理与镜像加速源已完全生效 🎉。

::: tip 常见问题

- **代理失效**：确认代理主机/端口是否可访问，或使用 `curl -x socks5h://... https://www.google.com` 测试透明度。
- **构建时仍慢**：如果 `Dockerfile` 中拉取外部依赖，可在 `docker build` 前设置 `BUILDKIT_PROXY_HTTP(S)` 等环境变量。
- **CI/CD 场景**：同样需要在 runner 节点配置 systemd drop-in 或导出环境变量。
  :::
