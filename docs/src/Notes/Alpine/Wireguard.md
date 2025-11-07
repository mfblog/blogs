---
title: "📡 WireGuard 搭建指南"
outline: deep
desc: "本文将介绍WireGuard VPN服务搭建指南"
tags: "wireguard"
updateTime: "2024-12-12 13:46:32"
---

# 📡 WireGuard 搭建指南

## 📡 网络基础配置

::: tip 多平台支持

```json
159.138.0.133

192.168.100.0/24

192.168.88.0/24
```

:::

## 安装部署

::: tip 多平台支持

支持Linux/Windows/macOS/iOS/Android
[官方安装指南](https://www.wireguard.com/install/)

:::

## Linux服务器安装

```bash
apt update && apt upgrade -y
apt install wireguard iptables -y
```

## 内核参数配置

```bash
echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
sysctl -p
```

## 中转服务端配置

::: danger 安全提醒

请妥善保管PrivateKey并定期更换密钥

```toml
[Interface]
PrivateKey = KMZcc5CyJMctcG1FDgiaBzzrb0hjhgkjUKy426tJn18=
Address = 10.0.0.100/16
ListenPort = 51820

PostUp = sysctl -w net.ipv4.ip_forward=1; iptables -A FORWARD -i wg0 -j ACCEPT
PostDown = sysctl -w net.ipv4.ip_forward=0; iptables -D FORWARD -i wg0 -j ACCEPT

# 办公室
[Peer]
PublicKey = va1+83gBmJ1gig+dh3YeFel5W/HOxHVWQ2v6M3ZgUic=
AllowedIPs = 10.0.0.3/32

# 手机
[Peer]
PublicKey = 05qATVYj0WVlRBeWc+C26AQGQjUCXobWkCdpjtwzHy4=
AllowedIPs = 10.0.0.4/32

:::

::: details 添加各自真实的局域网网段未测试

```toml
[Interface]
PrivateKey = KMZcc5CyJMctcG1FDgiaBzzrb0hjhgkjUKy426tJn18=
Address = 10.0.0.100/16
ListenPort = 51820

PostUp = sysctl -w net.ipv4.ip_forward=1; iptables -A FORWARD -i wg0 -j ACCEPT
PostDown = sysctl -w net.ipv4.ip_forward=0; iptables -D FORWARD -i wg0 -j ACCEPT

# 办公室（Office）Peer：包括办公室虚拟 IP 和局域网网段
[Peer]
PublicKey = va1+83gBmJ1gig+dh3YeFel5W/HOxHVWQ2v6M3ZgUic=
AllowedIPs = 10.0.0.3/32, 192.168.100.0/24

# 手机（Mobile）Peer：包括手机虚拟 IP 和局域网网段
[Peer]
PublicKey = 05qATVYj0WVlRBeWc+C26AQGQjUCXobWkCdpjtwzHy4=
AllowedIPs = 10.0.0.4/32, 192.168.88.0/24
```

:::

## 客户端配置

### 办公室客户端

```toml [/etc/wireguard/wg0.conf]
[Interface]
PrivateKey = cG0MxhUTvjg+oh3PCiZxBSHnpHHKQR3sxeUxtkYXjmA=
ListenPort = 51820
Address = 10.0.0.3/16

[Peer]
PublicKey = gXWXiB/PKNyEn4IlBeu+ZsYwezt7FnNAyJAR9frWinY=
AllowedIPs = 10.0.0.0/16
Endpoint = 159.138.0.133:51820
PersistentKeepalive = 15
```

::: details 添加各自真实的局域网网段未测试

```toml
[Interface]
PrivateKey = cG0MxhUTvjg+oh3PCiZxBSHnpHHKQR3sxeUxtkYXjmA=
Address = 10.0.0.3/16
ListenPort = 51820

[Peer]
# 中转服务器
PublicKey = gXWXiB/PKNyEn4IlBeu+ZsYwezt7FnNAyJAR9frWinY=
Endpoint = 159.138.0.133:51820
AllowedIPs = 10.0.0.0/16, 192.168.88.0/24
PersistentKeepalive = 15
```

:::

### 手机客户端(其他设备)

```toml [/etc/wireguard/wg0.conf]
[Interface]
PrivateKey = oHhBqbTGicqoHbZ+mWvcFcX5e/dodfDAZb0zk6ASoX0=
Address = 10.0.0.4/16
ListenPort = 51820

[Peer]
PublicKey = gXWXiB/PKNyEn4IlBeu+ZsYwezt7FnNAyJAR9frWinY=
Endpoint = 159.138.0.133:51820
AllowedIPs = 10.0.0.0/16
PersistentKeepalive = 15
```

::: details 添加各自真实的局域网网段未测试

```toml
[Interface]
PrivateKey = oHhBqbTGicqoHbZ+mWvcFcX5e/dodfDAZb0zk6ASoX0=
Address = 10.0.0.4/16
ListenPort = 51820

[Peer]
# 中转服务器
PublicKey = gXWXiB/PKNyEn4IlBeu+ZsYwezt7FnNAyJAR9frWinY=
Endpoint = 159.138.0.133:51820
AllowedIPs = 10.0.0.0/16, 192.168.100.0/24
PersistentKeepalive = 15
```

:::

## 服务管理

::: code-group

```bash[启动]
wg-quick up wg0
```

```bash[停止]
wg-quick down wg0
```

```bash[状态]
wg show
```

:::
