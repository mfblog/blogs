---
title: "📡 WireGuard 搭建指南"
outline: deep
desc: "使用 WireGuard 搭建中转服务器、办公室客户端与移动客户端的 VPN 网络"
tags: "WireGuard/VPN"
updateTime: "2024-12-12 13:46:32"
---

# 📡 WireGuard 搭建指南

WireGuard 配置简单、性能好，适合搭建个人 VPN、远程访问家庭网络或连接多个局域网。本文以一台公网中转服务器、一个办公室节点和一个移动设备为例，整理完整配置模板。

::: danger 密钥安全

不要把真实 `PrivateKey` 写进公开博客、仓库或截图。本文所有密钥均使用占位符，实际部署时请用 `wg genkey` 重新生成。

:::

## 示例网络规划

```text
公网中转服务器：server.example.com / 203.0.113.10
WireGuard 网段：10.0.0.0/24
中转服务器 VPN IP：10.0.0.1
办公室节点 VPN IP：10.0.0.3
移动设备 VPN IP：10.0.0.4
办公室局域网：192.168.100.0/24
家庭/移动侧局域网：192.168.88.0/24
监听端口：51820/udp
```

请按实际环境替换 IP、域名和网段。

## 安装 WireGuard

Debian/Ubuntu：

```bash
apt update
apt install -y wireguard iptables
```

开启 IPv4 转发：

```bash
echo "net.ipv4.ip_forward=1" >/etc/sysctl.d/99-wireguard.conf
sysctl --system
```

## 生成密钥

在每台设备上分别生成自己的私钥和公钥：

```bash
umask 077
wg genkey | tee privatekey | wg pubkey > publickey
```

查看：

```bash
cat privatekey
cat publickey
```

::: tip 密钥关系

- `PrivateKey` 只放在本机。
- `PublicKey` 可以分发给对端。
- 每台设备都应使用独立密钥，不要共用。

:::

## 中转服务器配置

编辑 `/etc/wireguard/wg0.conf`：

```ini
[Interface]
PrivateKey = SERVER_PRIVATE_KEY
Address = 10.0.0.1/24
ListenPort = 51820
PostUp = sysctl -w net.ipv4.ip_forward=1; iptables -A FORWARD -i wg0 -j ACCEPT; iptables -A FORWARD -o wg0 -j ACCEPT
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -D FORWARD -o wg0 -j ACCEPT

# 办公室节点
[Peer]
PublicKey = OFFICE_PUBLIC_KEY
AllowedIPs = 10.0.0.3/32, 192.168.100.0/24

# 移动设备
[Peer]
PublicKey = MOBILE_PUBLIC_KEY
AllowedIPs = 10.0.0.4/32
```

如果移动设备后面也有需要互通的局域网，可把它加入 `AllowedIPs`：

```ini
AllowedIPs = 10.0.0.4/32, 192.168.88.0/24
```

## 办公室客户端配置

编辑 `/etc/wireguard/wg0.conf`：

```ini
[Interface]
PrivateKey = OFFICE_PRIVATE_KEY
Address = 10.0.0.3/24

[Peer]
PublicKey = SERVER_PUBLIC_KEY
Endpoint = server.example.com:51820
AllowedIPs = 10.0.0.0/24, 192.168.88.0/24
PersistentKeepalive = 25
```

如果只需要访问 VPN 网段，不访问对端局域网：

```ini
AllowedIPs = 10.0.0.0/24
```

## 移动设备配置

移动端 WireGuard 客户端配置示例：

```ini
[Interface]
PrivateKey = MOBILE_PRIVATE_KEY
Address = 10.0.0.4/24

[Peer]
PublicKey = SERVER_PUBLIC_KEY
Endpoint = server.example.com:51820
AllowedIPs = 10.0.0.0/24, 192.168.100.0/24
PersistentKeepalive = 25
```

如果希望移动设备所有流量都走 VPN：

```ini
AllowedIPs = 0.0.0.0/0
```

::: warning 全局代理提醒

`AllowedIPs = 0.0.0.0/0` 会改变默认路由，所有 IPv4 流量都会尝试走 WireGuard。移动端使用前请确认服务器转发、NAT 和带宽成本。

:::

## 启动与自启

```bash
wg-quick up wg0
wg show
```

设置开机自启：

```bash
systemctl enable wg-quick@wg0
```

停止：

```bash
wg-quick down wg0
```

## 防火墙与安全组

公网服务器至少需要放行：

```text
51820/udp
```

如果服务器还要作为 NAT 出口，需要额外配置 NAT。假设公网网卡是 `eth0`：

```bash
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
```

对应的 `PostUp` / `PostDown` 可写入：

```ini
PostUp = sysctl -w net.ipv4.ip_forward=1; iptables -A FORWARD -i wg0 -j ACCEPT; iptables -A FORWARD -o wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -D FORWARD -o wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
```

## 验证

查看状态：

```bash
wg show
```

测试 VPN IP：

```bash
ping 10.0.0.1
ping 10.0.0.3
ping 10.0.0.4
```

测试对端局域网：

```bash
ping 192.168.100.1
ping 192.168.88.1
```

如果 `wg show` 中能看到 `latest handshake`，说明隧道已经建立。

## 常见问题

### 没有握手

- 服务器安全组未放行 UDP。
- 客户端 `Endpoint` 写错。
- 公钥填反或填错。
- 服务端未启动 `wg0`。

### 能握手但不能访问对端局域网

- `AllowedIPs` 没包含对端网段。
- 对端局域网没有返回路由。
- 中转服务器未开启 IP 转发。
- 防火墙未允许转发。

### 移动网络下连接不稳定

为 NAT 后的客户端保留：

```ini
PersistentKeepalive = 25
```

## 维护建议

- 每个设备单独生成密钥，丢设备后只替换该设备 Peer。
- 配置文件权限建议为 `600`：

```bash
chmod 600 /etc/wireguard/wg0.conf
```

- 修改配置后执行 `wg syncconf` 或重启 `wg-quick@wg0`。
- 网段规划写进文档，避免以后新增节点时发生冲突。
