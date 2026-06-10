---
title: "🚀 Docker 走 SOCKS5 代理拉取镜像"
outline: deep
desc: "通过 systemd drop-in 为 Docker Engine 配置 socks5h 代理，并验证 pull/build 网络请求"
tags: "Docker/Proxy"
updateTime: "2025-11-10 14:46:23"
---

# 🚀 Docker 走 SOCKS5 代理拉取镜像

Docker Engine 是 systemd 服务，`docker pull`、构建基础镜像下载、registry 访问都由 Docker 守护进程发起。因此，仅在当前 Shell 里设置 `HTTP_PROXY` 通常不够，需要给 Docker 服务本身注入代理环境变量。

本文以 Debian/Ubuntu 为例，使用 systemd drop-in 配置 SOCKS5 代理。

::: warning 适用场景

这个配置影响 Docker Engine 对外访问 registry 的流量，不等于自动给容器内部应用配置代理。容器运行后是否走代理，仍取决于容器自身环境变量、网络和应用配置。

:::

## 准备代理地址

示例代理地址：

```text
socks5h://192.168.88.3:8888
```

推荐使用 `socks5h`，让域名解析也交给代理端处理，减少本地 DNS 污染或解析失败的影响。

如果代理需要认证，格式通常类似：

```text
socks5h://username:password@proxy_host:proxy_port
```

## 配置 Docker 镜像源

镜像源不是必须项，但在国内网络环境下通常能提高可用性。请替换为自己可信且可访问的镜像源。

```bash
mkdir -p /etc/docker
tee /etc/docker/daemon.json >/dev/null <<'EOF'
{
  "registry-mirrors": [
    "https://<your-registry-mirror>"
  ]
}
EOF
```

::: tip 镜像源与代理的关系

镜像源解决 registry 入口访问问题，代理解决 Docker 守护进程出网问题。两者可以同时使用，但不是互相替代。

:::

## 配置 systemd 代理环境

创建 Docker 服务 drop-in 目录：

```bash
mkdir -p /etc/systemd/system/docker.service.d
```

写入代理配置：

```bash
tee /etc/systemd/system/docker.service.d/proxy.conf >/dev/null <<'EOF'
[Service]
Environment="HTTP_PROXY=socks5h://192.168.88.3:8888"
Environment="HTTPS_PROXY=socks5h://192.168.88.3:8888"
Environment="NO_PROXY=localhost,127.0.0.1,::1"
EOF
```

如果内网还有私有 registry，可以把地址加入 `NO_PROXY`：

```text
NO_PROXY=localhost,127.0.0.1,::1,registry.local,10.0.0.0/8,192.168.0.0/16
```

## 重载并重启 Docker

```bash
systemctl daemon-reload
systemctl restart docker
```

如果系统有异常缓存，也可以使用：

```bash
systemctl daemon-reexec
systemctl daemon-reload
systemctl restart docker
```

## 验证代理是否生效

查看 systemd 注入的环境变量：

```bash
systemctl show --property=Environment docker
```

查看 Docker 识别到的代理：

```bash
docker info | grep -A 8 -i "proxy"
```

测试拉取镜像：

```bash
docker pull alpine
docker run --rm alpine cat /etc/alpine-release
```

## 构建场景补充

Dockerfile 中如果需要访问外网，比如 `apt update`、`npm install`、`go mod download`，还要看构建阶段是否继承代理。可以在构建时传入：

```bash
docker build \
  --build-arg HTTP_PROXY=socks5h://192.168.88.3:8888 \
  --build-arg HTTPS_PROXY=socks5h://192.168.88.3:8888 \
  -t my-image .
```

BuildKit 场景也可以配合环境变量使用，具体取决于 Docker 版本和构建方式。

## 常见问题

### `docker info` 看不到代理

检查 drop-in 是否被 systemd 识别：

```bash
systemctl cat docker
systemctl status docker --no-pager
```

确认文件路径是：

```text
/etc/systemd/system/docker.service.d/proxy.conf
```

### 代理地址不可达

在宿主机测试代理：

```bash
curl -x socks5h://192.168.88.3:8888 https://registry-1.docker.io/v2/
```

### 容器内应用仍然无法联网

这通常不是 Docker Engine 代理问题，而是容器内部没有代理配置。可以运行容器时显式传入：

```bash
docker run --rm \
  -e HTTP_PROXY=socks5h://192.168.88.3:8888 \
  -e HTTPS_PROXY=socks5h://192.168.88.3:8888 \
  alpine wget -qO- https://example.com
```

## 取消代理

删除 drop-in 文件并重启：

```bash
rm -f /etc/systemd/system/docker.service.d/proxy.conf
systemctl daemon-reload
systemctl restart docker
```

再次检查：

```bash
docker info | grep -A 8 -i "proxy"
```
