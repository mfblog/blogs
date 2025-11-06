---
title: "↔️ 内网穿透终解(二)"
outline: deep
desc: "本文将介绍Frp Server搭建与Caddy搭建"
tags: "阿里云/Frp/Caddy"
updateTime: "2024-12-12 13:08:32"
---

## Frp Server搭建与Caddy搭建

## Frp Server搭建

::: tip 环境准备

```bash
mkdir -p /usr/local/frp
```

:::

## 服务端部署流程

### 下载最新版本

[下载最新版本](https://github.com/fatedier/frp/releases/)

### 解压安装包

```bash
tar -zxvf 压缩文件名.tar.gz
```

### 配置文件示例

```toml
bindPort = 7000
auth.token = "123321"
vhostHTTPPort = 8080
webServer.addr = "0.0.0.0"
webServer.port = 7500
webServer.user = "aa123"
webServer.password = "aa123"
```

### 权限设置

```bash
chmod 777 *
```

::: warning 服务配置

```js
#!/sbin/openrc-run

name="frp-server"
description="FRP server (frps)"
command="/usr/local/frp/frps"
command_args="-c /usr/local/frp/frps.toml"
pidfile="/var/run/frp-server.pid"

depend() { after network; }

start() {
    ebegin "Starting $name"
    start-stop-daemon --start --background \
        --pidfile $pidfile --make-pidfile \
        --exec $command -- $command_args
    eend $?
}

stop() {
    ebegin "Stopping $name"
    start-stop-daemon --stop --pidfile $pidfile
    eend $?
}
```

:::

## 服务管理命令

```bash
rc-update add frps-server  # 添加开机启动
rc-service frps-server start  # 启动服务
rc-service frps-server status  # 查看状态
```

## Caddy搭建

::: tip 安装步骤

```bash
mkdir -p /root/caddy
wget -O /root/caddy/caddy 'https://caddyserver.com/api/download?os=linux&arch=amd64'
chmod 777 /root/caddy/caddy
```

:::

## 配置文件示例

```json
解析好的域名 {
    reverse_proxy 127.0.0.1:3000
    encode gzip
}

解析好的域名 {
    reverse_proxy 127.0.0.1:4395
    encode gzip
}

解析好的域名 {
    reverse_proxy 127.0.0.1:5701
    encode gzip
}
```

::: danger 服务配置

```js
#!/sbin/openrc-run

name="caddy"
description="Caddy Web Server"
command="/root/caddy/caddy"
command_args="run --config /root/caddy/Caddyfile --adapter caddyfile"
pidfile="/var/run/caddy.pid"

depend() { after network; }

start() {
    ebegin "Starting $name"
    start-stop-daemon --start --background \
        --pidfile $pidfile --make-pidfile \
        --exec $command -- $command_args
    eend $?
}

stop() {
    ebegin "Stopping $name"
    start-stop-daemon --stop --pidfile $pidfile
    eend $?
}
```
:::

::: details Systemd服务文件

```bash
vim /etc/systemd/system/caddy.service
```

```bash
[Unit]
Description=Caddy Web Server
Documentation=https://caddyserver.com/docs/
After=network.target

[Service]
User=root
ExecStart=/root/caddy/caddy run --config /root/caddy/Caddyfile --adapter caddyfile
ExecReload=/bin/kill -HUP $$MAINPID
Restart=on-failure
PIDFile=/var/run/caddy.pid
LimitNOFILE=8192
Environment=CADDY_ADAPTER=caddyfile

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl start caddy
systemctl enable caddy
systemctl status caddy
```

:::
