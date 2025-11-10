---
title: "🌐 EasyTier 网对网部署指南"
outline: deep
desc: "一步步完成中转、办公室、家庭节点的 EasyTier 服务部署"
tags: "EasyTier/VPN"
updateTime: "2025-11-10 16:01:41"
---

安装 EasyTier 时，需要分别为**中转服务器**与各个节点准备二进制核心文件，统一放在 `/usr/local/easytier`，再通过 systemd 管理服务。以下示例均可按需调整网络名称、节点 IP、端口。

## 📥 下载核心文件

```bash
mkdir -p /usr/local/easytier
```

从 [GitHub Releases](https://github.com/EasyTier/EasyTier/releases) 下载对应平台的 `easytier-core`，上传到 `/usr/local/easytier/` 目录。

## 🚏 中转服务器（打洞节点）

```bash
vim /etc/systemd/system/easytier.service
```

```bash
[Unit]
Description=EasyTier Service
After=network.target syslog.target
Wants=network.target

[Service]
Type=simple
ExecStart=/usr/local/easytier/easytier-core -d --network-name fuzhou --hostname HW-Shanghai --vpn-portal wg://0.0.0.0:11013/10.16.16.0/24

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable easytier.service
systemctl daemon-reload
systemctl start easytier.service
systemctl status easytier.service
```

> 参数含义可参考 EasyTier 官方 wiki，视需求增删节点名、网络段等配置。

## 🏢 办公室节点

```bash
vim /etc/systemd/system/easytier.service
```

```bash
[Unit]
Description=EasyTier Service
After=network.target syslog.target
Wants=network.target

[Service]
Type=simple
ExecStart=/usr/local/easytier/easytier-core -i 192.168.66.3 -n 服务器子网网段/24 -p tcp://服务器ip:11010 --network-name fuzhou --hostname Office-N1 --enable-quic-proxy --multi-thread --latency-first

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable easytier.service
systemctl daemon-reload
systemctl start easytier.service
systemctl status easytier.service
```

## 🏠 家庭节点

```bash
vim /etc/systemd/system/easytier.service
```

```bash
[Unit]
Description=EasyTier Service
After=network.target syslog.target
Wants=network.target

[Service]
Type=simple
ExecStart=/usr/local/easytier/easytier-core -i 192.168.66.2 -n 家庭子网网段/24 -p tcp://服务器Ip:11010 --network-name fuzhou --enable-quic-proxy --multi-thread --latency-first

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable easytier.service
systemctl daemon-reload
systemctl start easytier.service
systemctl status easytier.service
```

::: tip 验证与扩展
- `journalctl -u easytier.service` 观察日志，确认节点连通。
- 可为不同节点配置独立 `--hostname`，方便在 EasyTier 控制台识别。
- 若需要 QUIC 代理或多线程加速，保持 `--enable-quic-proxy --multi-thread --latency-first` 参数。
:::
