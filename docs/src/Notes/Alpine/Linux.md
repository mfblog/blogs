---
title: "🐧 Linux 笔记"
outline: deep
desc: "Debian/Ubuntu 服务器中文环境、Docker 与 NFS 共享服务初始化笔记"
tags: "Linux/Docker/NFS"
updateTime: "2024-12-10 09:06:32"
---

# 🐧 Linux 笔记

这篇笔记整理 Debian/Ubuntu 服务器上最常用的三类初始化操作：中文环境、Docker 部署和 NFS 文件共享。

::: warning 适用范围

命令以 Debian/Ubuntu 系统为主，默认使用 `apt` 和 `systemd`。如果是 Alpine，请参考 Alpine 专用笔记。

:::

## 中文环境

最小化系统经常缺少中文 locale 和字体，表现为终端、日志或应用页面出现乱码。可以先安装语言包和字体，再设置环境变量。

```bash
apt update
apt install -y locales locales-all fonts-wqy-zenhei fonts-wqy-microhei
dpkg-reconfigure locales
```

在交互界面中选择 `zh_CN.UTF-8 UTF-8`，并将默认 locale 设置为 `zh_CN.UTF-8`。

如需临时在当前会话中生效：

```bash
export LANG="zh_CN.UTF-8"
export LANGUAGE="zh_CN:zh"
export LC_ALL="zh_CN.UTF-8"
```

验证：

```bash
locale
date
```

## Docker 部署

### 快速安装

如果只是个人测试机，可以使用一键脚本快速安装：

```bash
curl -fsSL https://gitee.com/tech-shrimp/docker_installer/releases/download/latest/linux.sh \
  | bash -s docker --mirror Aliyun
```

::: tip 生产环境建议

生产环境更推荐使用 Docker 官方软件源安装，便于控制版本、审计来源和升级节奏。

:::

### 镜像源配置

创建 Docker 配置目录并写入镜像加速源：

```bash
mkdir -p /etc/docker
tee /etc/docker/daemon.json >/dev/null <<'EOF'
{
  "registry-mirrors": [
    "https://hub.geekery.cn/",
    "https://ghcr.geekery.cn"
  ]
}
EOF
```

重启服务：

```bash
systemctl daemon-reload
systemctl restart docker
docker info | grep -A 5 "Registry Mirrors"
```

## NFS 共享服务

NFS 适合在可信内网中共享目录，例如把一台服务器作为文件中心，供同网段 Linux 客户端挂载。

### 服务端安装

```bash
apt update
apt install -y nfs-kernel-server
systemctl enable --now nfs-kernel-server
```

创建共享目录：

```bash
mkdir -p /mnt/nfs
chown nobody:nogroup /mnt/nfs
chmod 755 /mnt/nfs
```

编辑 `/etc/exports`：

```text
/mnt/nfs 192.168.100.0/24(rw,async,no_subtree_check,no_root_squash)
```

应用配置：

```bash
exportfs -rav
systemctl restart nfs-kernel-server
exportfs -v
```

::: warning 权限提醒

`no_root_squash` 会让客户端 `root` 在共享目录中保留较高权限。只建议在可信内网使用；多人或不可信环境应改用更保守的权限策略。

:::

### 客户端挂载

安装客户端工具：

```bash
apt install -y nfs-common
mkdir -p /mnt/nfs
```

临时挂载：

```bash
mount -t nfs 192.168.100.88:/mnt/nfs /mnt/nfs
df -h | grep nfs
```

开机自动挂载：

```text
192.168.100.88:/mnt/nfs  /mnt/nfs  nfs  defaults,_netdev  0  0
```

验证：

```bash
systemctl daemon-reload
mount -a
touch /mnt/nfs/nfs-test.txt
```

## 排障思路

- 服务端先看 `systemctl status nfs-kernel-server`。
- 客户端先确认能 ping 通服务端 IP。
- 用 `showmount -e <server-ip>` 查看服务端导出的目录。
- 跨网段访问时，确认防火墙和 `/etc/exports` 网段范围一致。
- 大文件传输频繁时，可以继续评估 NFS 参数、磁盘性能和网络 MTU。
