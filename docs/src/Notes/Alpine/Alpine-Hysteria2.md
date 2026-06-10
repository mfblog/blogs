---
title: "📑 Alpine 手动搭建 Hysteria2"
outline: deep
desc: "在 Alpine 上安装 Hysteria2，配置 ACME 证书、密码认证、伪装站点与 OpenRC 服务"
tags: "Alpine/Hysteria2"
updateTime: "2024-12-24 10:06:32"
---

# 📑 Alpine 手动搭建 Hysteria2

Hysteria2 基于 QUIC，适合在高延迟或不稳定网络中使用。本文记录在 Alpine 上手动部署 Hysteria2 服务端的流程，包括二进制安装、配置文件、OpenRC 服务和验证排障。

::: warning 合规提醒

请在遵守当地法律法规、云厂商条款和网络管理规则的前提下使用。本文只记录服务端部署方法，不提供任何规避监管或滥用用途的建议。

:::

## 准备条件

- 一台 Alpine 服务器。
- 一个已解析到服务器公网 IP 的域名，例如 `hy2.example.com`。
- 防火墙和安全组放行 UDP 端口，例如 `443/udp`。
- 如果使用 Cloudflare DNS 申请证书，需要准备具备 DNS 编辑权限的 API Token。

## 安装 Hysteria2

创建目录并下载二进制：

```bash
apk update
apk add ca-certificates wget

wget -O /usr/local/bin/hysteria \
  https://download.hysteria.network/app/latest/hysteria-linux-amd64

chmod 755 /usr/local/bin/hysteria
hysteria version
```

::: tip 架构提醒

如果服务器不是 `amd64`，请下载对应架构的二进制文件。

:::

## 创建配置目录

```bash
mkdir -p /etc/hysteria
chmod 700 /etc/hysteria
```

## 服务端配置

编辑 `/etc/hysteria/config.yaml`：

```yaml
listen: :443

acme:
  domains:
    - hy2.example.com
  email: admin@example.com
  type: dns
  dns:
    name: cloudflare
    config:
      cloudflare_api_token: "replace-with-cloudflare-api-token"

auth:
  type: password
  password: "replace-with-a-strong-password"

masquerade:
  type: proxy
  proxy:
    url: https://www.bing.com
    rewriteHost: true
```

关键配置说明：

| 配置 | 说明 |
| --- | --- |
| `listen` | 服务监听端口，Hysteria2 通常使用 UDP |
| `acme.domains` | 用于申请证书的域名 |
| `acme.email` | 证书通知邮箱 |
| `cloudflare_api_token` | DNS 验证 Token，不要公开 |
| `auth.password` | 客户端连接密码 |
| `masquerade` | 伪装访问目标 |

设置权限：

```bash
chmod 600 /etc/hysteria/config.yaml
```

## OpenRC 服务

创建 `/etc/init.d/hy2`：

```sh
#!/sbin/openrc-run

name="hysteria"
description="Hysteria2 server"
command="/usr/local/bin/hysteria"
command_args="server --config /etc/hysteria/config.yaml"
command_background="yes"
pidfile="/run/hysteria.pid"
output_log="/var/log/hysteria.log"
error_log="/var/log/hysteria.err"

depend() {
  need net
  after firewall
}
```

授权并启动：

```bash
chmod 755 /etc/init.d/hy2
rc-update add hy2 default
rc-service hy2 start
rc-service hy2 status
```

查看日志：

```bash
tail -f /var/log/hysteria.log
tail -f /var/log/hysteria.err
```

## 防火墙与安全组

确认云厂商安全组放行 UDP：

```text
443/udp
```

如果服务器本机启用了防火墙，也需要放行对应端口。不同防火墙工具命令不同，请按实际环境配置。

## 验证

检查进程：

```bash
ps aux | grep hysteria
```

检查 UDP 监听：

```bash
ss -lunp | grep 443
```

检查证书申请日志：

```bash
grep -i "acme\|cert\|error" /var/log/hysteria.log /var/log/hysteria.err
```

客户端连接测试请使用官方 Hysteria2 客户端，并保持域名、端口、密码与服务端一致。

## 常见问题

### 证书申请失败

- 域名没有正确解析。
- Cloudflare API Token 权限不足。
- DNS 记录变更尚未生效。
- 系统时间不正确，先检查 `date`。

### 客户端无法连接

- 云安全组没有放行 UDP 端口。
- 客户端连接到了 TCP 端口，或端口填写错误。
- 密码不一致。
- 服务端进程未启动或配置文件 YAML 缩进错误。

### 端口被占用

```bash
ss -lunp | grep 443
```

换一个端口后，同步修改安全组和客户端配置。

## 维护建议

- 密码、API Token 不要写进公开仓库。
- 定期升级 Hysteria2 二进制，并保留旧版本以便回滚。
- 修改配置后先执行启动测试，再加入开机自启。
- 服务器时间必须准确，否则 ACME 证书流程可能失败。
