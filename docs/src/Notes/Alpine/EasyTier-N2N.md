---
title: "🕸️ EasyTier N2N 实战指南"
outline: deep
desc: "使用 EasyTier 搭建中转、办公室、家庭三节点网对网网络，并用 systemd 管理服务"
tags: "EasyTier/VPN"
updateTime: "2025-11-12 13:49:16"
---

# 🕸️ EasyTier N2N 实战指南

EasyTier 可以用较轻的方式搭建 L3 网对网网络。本文以“中转节点 + 办公室节点 + 家庭节点”为例，记录如何部署 `easytier-core`，并用 systemd 管理服务。

::: warning 网络规划先行

部署前请先确认各地局域网网段不要冲突。例如办公室是 `192.168.100.0/24`，家庭就不要也使用同一网段，否则路由会混乱。

:::

## 示例拓扑

```text
办公室局域网 192.168.100.0/24
  |
  | EasyTier
  v
公网中转节点
  ^
  | EasyTier
  |
家庭局域网 192.168.88.0/24
```

示例参数：

| 项目 | 示例值 |
| --- | --- |
| 网络名 | `fuzhou` |
| 中转节点 hostname | `HW-Shanghai` |
| 办公室节点 hostname | `Office-N1` |
| 家庭节点 hostname | `Home-N1` |
| Portal 网段 | `10.16.16.0/24` |
| 办公室虚拟 IP | `192.168.66.3` |
| 家庭虚拟 IP | `192.168.66.2` |
| 中转连接地址 | `tcp://server.example.com:11010` |

请按自己的网络环境替换。

## 安装核心文件

所有节点统一创建目录：

```bash
mkdir -p /usr/local/easytier
```

前往 Release 页面下载对应平台的 `easytier-core`：

[EasyTier Releases](https://github.com/EasyTier/EasyTier/releases)

上传到 `/usr/local/easytier/` 后设置权限：

```bash
chmod 755 /usr/local/easytier/easytier-core
/usr/local/easytier/easytier-core --version
```

## 中转节点配置

创建 `/etc/systemd/system/easytier.service`：

```ini
[Unit]
Description=EasyTier Portal Node
After=network.target
Wants=network.target

[Service]
Type=simple
ExecStart=/usr/local/easytier/easytier-core -d \
  --network-name fuzhou \
  --hostname HW-Shanghai \
  --vpn-portal wg://0.0.0.0:11013/10.16.16.0/24
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
systemctl daemon-reload
systemctl enable --now easytier.service
systemctl status easytier.service --no-pager
```

查看日志：

```bash
journalctl -u easytier.service -e --no-pager
```

## 办公室节点配置

创建 `/etc/systemd/system/easytier.service`：

```ini
[Unit]
Description=EasyTier Office Node
After=network.target
Wants=network.target

[Service]
Type=simple
ExecStart=/usr/local/easytier/easytier-core \
  -i 192.168.66.3 \
  -n 192.168.100.0/24 \
  -p tcp://server.example.com:11010 \
  --network-name fuzhou \
  --hostname Office-N1 \
  --enable-quic-proxy \
  --multi-thread \
  --latency-first
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

启动：

```bash
systemctl daemon-reload
systemctl enable --now easytier.service
systemctl status easytier.service --no-pager
```

## 家庭节点配置

创建 `/etc/systemd/system/easytier.service`：

```ini
[Unit]
Description=EasyTier Home Node
After=network.target
Wants=network.target

[Service]
Type=simple
ExecStart=/usr/local/easytier/easytier-core \
  -i 192.168.66.2 \
  -n 192.168.88.0/24 \
  -p tcp://server.example.com:11010 \
  --network-name fuzhou \
  --hostname Home-N1 \
  --enable-quic-proxy \
  --multi-thread \
  --latency-first
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

启动：

```bash
systemctl daemon-reload
systemctl enable --now easytier.service
systemctl status easytier.service --no-pager
```

## 验证互通

先看服务状态：

```bash
systemctl status easytier.service --no-pager
journalctl -u easytier.service -e --no-pager
```

再测试虚拟 IP：

```bash
ping 192.168.66.2
ping 192.168.66.3
```

测试对端局域网地址：

```bash
ping 192.168.88.1
ping 192.168.100.1
```

如果需要访问对端内网服务，再用实际端口测试：

```bash
curl -I http://192.168.88.10:8080
```

## 防火墙与路由

- 中转节点需要放行 EasyTier 使用的端口，例如 `11010/tcp`、`11013/udp`。
- 办公室和家庭节点需要允许转发到本地局域网。
- 如果局域网主路由不知道 EasyTier 网段，需要在路由器上添加静态路由，或在 EasyTier 节点上做转发/NAT。

## 常见问题

### 节点能连中转，但访问不了对端局域网

优先检查：

- `-n` 参数是否填写了正确的本地子网。
- 对端局域网网段是否冲突。
- 本地防火墙是否允许转发。
- 局域网设备的默认网关是否知道返回路由。

### 日志里没有握手

检查中转地址和端口：

```bash
nc -vz server.example.com 11010
```

同时查看中转节点日志：

```bash
journalctl -u easytier.service -f
```

### 新增节点

复制办公室或家庭节点模板，至少修改：

- `-i` 虚拟 IP。
- `-n` 本地子网。
- `--hostname` 节点名称。
- `-p` 中转地址。

## 维护建议

- 节点名保持唯一，便于日志和控制台识别。
- 变更网络名、端口或中转地址后，所有节点要同步修改。
- 网络稳定后，再把配置纳入自动化部署或备份。
