---
title: "📡 WireGuard 搭建指南"
outline: deep
desc: "本文将介绍WireGuard VPN服务搭建指南"
tags: "wireguard"
updateTime: "2024-12-12 13:46:32"
---

## 📡 网络基础配置
::: tip 多平台支持
```json
1.1.1.1

192.168.88.0/24

192.168.88.6
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
## 服务端配置
::: danger 安全提醒
请妥善保管PrivateKey并定期更换密钥
```toml
[Interface]
Address = 192.168.66.1/32
ListenPort = 28385
PrivateKey = KMogtlOWTKnClS0u0nBlSFwKc1/y9PdvTX9uA04Jr0o=

# 流量转发规则
PostUp = iptables -I FORWARD -s 192.168.66.0/24 -i wg0 -d 192.168.66.0/24 -j ACCEPT
PostUp = iptables -I FORWARD -s 192.168.66.0/24 -i wg0 -d 192.168.88.0/24 -j ACCEPT
PostUp = iptables -I FORWARD -s 192.168.88.0/24 -i wg0 -d 192.168.66.0/24 -j ACCEPT
PostDown = iptables -D FORWARD -s 192.168.66.0/24 -i wg0 -d 192.168.66.0/24 -j ACCEPT
PostDown = iptables -D FORWARD -s 192.168.66.0/24 -i wg0 -d 192.168.88.0/24 -j ACCEPT
PostDown = iptables -D FORWARD -s 192.168.88.0/24 -i wg0 -d 192.168.66.0/24 -j ACCEPT

[Peer]
PublicKey = ekN9E8q+kG/D5GsBPj1zL3ouWJ+Jy0hNB5EgG7luZmE=
AllowedIPs = 192.168.66.2/32, 192.168.88.0/24

[Peer]
PublicKey = Wt5cT7fQH/b7c4bpE6o66ndJ/Dtrx+9NG/kket/U130=
AllowedIPs = 192.168.66.3/32
:::

## 客户端配置
### Linux客户端
```toml [/etc/wireguard/wg0.conf]
[Interface]
Address = 192.168.66.2/32
PrivateKey = EJ3hMqMznqlSRQFUaAbgNfCYLviGcF+pVf5wbJII80k=

# NAT规则
PostUp = iptables -t nat -A POSTROUTING -s 192.168.66.0/24 -j SNAT --to-source 192.168.88.170
PostDown = iptables -t nat -D POSTROUTING -s 192.168.66.0/24 -j SNAT --to-source 192.168.88.170

[Peer]
PublicKey = +e03qUCb730zy2db+ViCCvzbvW1xOZyk8+QSRk4GbCo=
Endpoint = 1.1.1.1:28385
AllowedIPs = 192.168.66.0/24
PersistentKeepalive = 25
```

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