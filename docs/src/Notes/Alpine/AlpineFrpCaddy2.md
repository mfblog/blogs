---
title: "↔️ 内网穿透终解(二)"
outline: deep
desc: "在 Alpine 上部署 FRP 服务端与 Caddy 反向代理，并使用 OpenRC 或 systemd 管理服务"
tags: "阿里云/Frp/Caddy"
updateTime: "2024-12-12 13:08:32"
---

# ↔️ 内网穿透终解(二)

上一篇完成了 Alpine ECS 的准备。这一篇继续部署云端入口：`frps` 负责接收内网客户端连接，Caddy 负责把公网域名反向代理到 FRP 暴露出来的本地端口，并自动管理 HTTPS。

::: warning 安全提醒

示例中的 Token、Dashboard 用户名和密码都必须替换。FRP Dashboard 不建议直接暴露到公网，至少要配合安全组、强密码或 VPN 使用。

:::

## 目录规划

```bash
mkdir -p /usr/local/frp
mkdir -p /etc/frp
mkdir -p /opt/caddy
mkdir -p /etc/caddy
```

推荐路径：

| 路径 | 用途 |
| --- | --- |
| `/usr/local/frp/frps` | FRP 服务端二进制 |
| `/etc/frp/frps.toml` | FRP 服务端配置 |
| `/opt/caddy/caddy` | Caddy 二进制 |
| `/etc/caddy/Caddyfile` | Caddy 配置 |

## 安装 FRP 服务端

前往 FRP Release 页面下载对应系统和架构的压缩包：

[FRP Releases](https://github.com/fatedier/frp/releases/)

示例：

```bash
cd /tmp
tar -zxvf frp_*_linux_amd64.tar.gz
cd frp_*_linux_amd64
install -m 755 frps /usr/local/frp/frps
install -m 644 frps.toml /etc/frp/frps.toml
```

确认版本：

```bash
/usr/local/frp/frps --version
```

## 配置 frps

编辑 `/etc/frp/frps.toml`：

```toml
bindPort = 7000
auth.token = "replace-with-a-strong-token"

vhostHTTPPort = 8080

[webServer]
addr = "127.0.0.1"
port = 7500
user = "admin"
password = "replace-with-a-strong-password"
```

配置说明：

| 配置 | 说明 |
| --- | --- |
| `bindPort` | frpc 连接 frps 的控制端口 |
| `auth.token` | 服务端与客户端共享 Token |
| `vhostHTTPPort` | FRP 接收 HTTP 虚拟主机流量的端口 |
| `webServer.addr` | Dashboard 监听地址，建议只监听本机 |

::: tip 为什么 Dashboard 监听 `127.0.0.1`

Dashboard 只给本机 Caddy 或 SSH 隧道访问，可以减少公网暴露面。如果确实要公网访问，请用安全组限制来源 IP。

:::

## Alpine OpenRC 服务

创建 `/etc/init.d/frps`：

```sh
#!/sbin/openrc-run

name="frps"
description="FRP server"
command="/usr/local/frp/frps"
command_args="-c /etc/frp/frps.toml"
command_background="yes"
pidfile="/run/frps.pid"

depend() {
  need net
  after firewall
}
```

授权并启动：

```bash
chmod 755 /etc/init.d/frps
rc-update add frps default
rc-service frps start
rc-service frps status
```

## systemd 服务文件

如果是在 Debian/Ubuntu 上运行，可以使用 systemd：

```ini
[Unit]
Description=FRP Server
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/frp/frps -c /etc/frp/frps.toml
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

保存为 `/etc/systemd/system/frps.service` 后启用：

```bash
systemctl daemon-reload
systemctl enable --now frps
systemctl status frps --no-pager
```

## 安装 Caddy

Alpine 可以直接下载官方二进制：

```bash
wget -O /opt/caddy/caddy 'https://caddyserver.com/api/download?os=linux&arch=amd64'
chmod 755 /opt/caddy/caddy
/opt/caddy/caddy version
```

如果系统仓库里已有 Caddy，也可以用包管理器安装，后续配置思路相同。

## 配置 Caddyfile

编辑 `/etc/caddy/Caddyfile`：

```text
app.example.com {
  reverse_proxy 127.0.0.1:3000
  encode gzip
}

panel.example.com {
  reverse_proxy 127.0.0.1:4395
  encode gzip
}

api.example.com {
  reverse_proxy 127.0.0.1:5701
  encode gzip
}
```

如果要通过 Caddy 访问 FRP Dashboard：

```text
frp-dashboard.example.com {
  reverse_proxy 127.0.0.1:7500
  encode gzip
}
```

::: warning 域名要求

Caddy 自动申请 HTTPS 证书时，域名必须已经解析到当前 ECS 公网 IP，且安全组放行 `80/tcp` 与 `443/tcp`。

:::

## Alpine OpenRC 管理 Caddy

创建 `/etc/init.d/caddy`：

```sh
#!/sbin/openrc-run

name="caddy"
description="Caddy Web Server"
command="/opt/caddy/caddy"
command_args="run --config /etc/caddy/Caddyfile --adapter caddyfile"
command_background="yes"
pidfile="/run/caddy.pid"

depend() {
  need net
  after firewall
}
```

启动：

```bash
chmod 755 /etc/init.d/caddy
rc-update add caddy default
rc-service caddy start
rc-service caddy status
```

## systemd 管理 Caddy

```ini
[Unit]
Description=Caddy Web Server
Documentation=https://caddyserver.com/docs/
After=network.target

[Service]
Type=simple
ExecStart=/opt/caddy/caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=5s
LimitNOFILE=8192

[Install]
WantedBy=multi-user.target
```

保存为 `/etc/systemd/system/caddy.service` 后启用：

```bash
systemctl daemon-reload
systemctl enable --now caddy
systemctl status caddy --no-pager
```

## 验证

检查监听端口：

```bash
ss -lntup
```

检查 FRP：

```bash
rc-service frps status
/usr/local/frp/frps verify -c /etc/frp/frps.toml
```

检查 Caddy 配置：

```bash
/opt/caddy/caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
```

测试站点：

```bash
curl -I https://app.example.com
```

## 排障清单

- `frpc` 连不上：检查安全组、`bindPort`、Token、FRP 日志。
- 域名 502：检查内网服务是否已经通过 FRP 暴露到对应端口。
- Caddy 证书失败：检查 DNS 是否指向当前 ECS，`80/443` 是否放行。
- Dashboard 打不开：确认 `webServer.addr` 是不是只监听 `127.0.0.1`，以及是否配置了 Caddy 代理。
- Alpine 服务不起：检查 `/etc/init.d/*` 是否有执行权限，脚本头是否为 `#!/sbin/openrc-run`。
