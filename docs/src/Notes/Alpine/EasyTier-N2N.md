---
title: "🕸️ EasyTier N2N 实战指南"
outline: deep
desc: "借助中转、办公室、家庭节点示例，快速搭建 EasyTier 网对网网络"
tags: "EasyTier/VPN"
updateTime: "2025-11-12 13:49:16"
---

EasyTier 提供了轻量级的 L3 网对网（N2N）连接方式。本文按照中转节点 → 办公室节点 → 家庭节点的顺序，演示如何使用 systemd 管理 `easytier-core` 服务，并给出常见排障技巧。

::: info 环境说明

- 所有节点均将核心二进制放在 `/usr/local/easytier`
- 服务通过 systemd 管理，方便开机自启与状态管理
- 参数示例使用 `fuzhou` 网络名，端口 `11010/11013`，请按实际拓扑调整

:::

## 📥 获取核心文件

```bash
mkdir -p /usr/local/easytier
```

前往 [EasyTier Releases](https://github.com/EasyTier/EasyTier/releases) 下载对应平台的 `easytier-core`，上传至 `/usr/local/easytier/`，并确保具有执行权限。

## 🚏 中转服务器（打洞 / Portal）

```bash
vim /etc/systemd/system/easytier.service
```

```bash
[Unit]
Description=EasyTier Portal Node
After=network.target syslog.target
Wants=network.target

[Service]
Type=simple
ExecStart=/usr/local/easytier/easytier-core -d \
  --network-name fuzhou \
  --hostname HW-Shanghai \
  --vpn-portal wg://0.0.0.0:11013/10.16.16.0/24

[Install]
WantedBy=multi-user.target
```

::: code-group

```bash [Enable]
systemctl enable easytier.service
systemctl daemon-reload
systemctl start easytier.service
```

```bash [Status]
systemctl status easytier.service
journalctl -u easytier.service -e --no-pager
```

:::

## 🏢 办公室节点

```bash:notebook
vim /etc/systemd/system/easytier.service
```

```bash
[Unit]
Description=EasyTier Office Node
After=network.target syslog.target
Wants=network.target

[Service]
Type=simple
ExecStart=/usr/local/easytier/easytier-core \
  -i 192.168.66.3 \
  -n 服务器子网网段/24 \
  -p tcp://服务器ip:11010 \
  --network-name fuzhou \
  --hostname Office-N1 \
  --enable-quic-proxy \
  --multi-thread \
  --latency-first

[Install]
WantedBy=multi-user.target
```

::: code-group

```bash [Enable]
systemctl enable easytier.service
systemctl daemon-reload
systemctl start easytier.service
```

```bash [Status]
systemctl status easytier.service
journalctl -u easytier.service -e --no-pager
```

:::

## 🏠 家庭节点

```bash
vim /etc/systemd/system/easytier.service
```

```bash
[Unit]
Description=EasyTier Home Node
After=network.target syslog.target
Wants=network.target

[Service]
Type=simple
ExecStart=/usr/local/easytier/easytier-core \
  -i 192.168.66.2 \
  -n 家庭子网网段/24 \
  -p tcp://服务器Ip:11010 \
  --network-name fuzhou \
  --enable-quic-proxy \
  --multi-thread \
  --latency-first

[Install]
WantedBy=multi-user.target
```

::: code-group

```bash [Enable]
systemctl enable easytier.service
systemctl daemon-reload
systemctl start easytier.service
```

```bash [Status]
systemctl status easytier.service
journalctl -u easytier.service -e --no-pager
```

:::

## ✅ 验证与优化

::: tip 建议检查

- `journalctl -u easytier.service` 查看日志，确认节点成功握手
- 为不同节点设置唯一 `--hostname`，方便在 EasyTier 控制台辨识
- 需要更强性能时，可调 `--multi-thread`、`--latency-first` 相关参数

:::

部署完成后，办公室与家庭节点即可通过中转 Portal 建立安全的 N2N 网络，实现互通。若需要新增节点，只需复制对应 systemd 模板并调整 IP / hostname 即可。
