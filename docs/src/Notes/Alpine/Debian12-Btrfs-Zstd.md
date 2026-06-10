---
title: "🗂️ Debian 服务器 Btrfs + Zstd 维护清单"
outline: deep
desc: "面向 Debian 服务器的 Btrfs + Zstd 压缩检查、空间维护、Scrub、Balance、快照与排障清单"
tags: "Debian/Btrfs/Zstd/服务器"
updateTime: "2026-04-08 09:16:00"
---

# 🗂️ Debian 服务器 Btrfs + Zstd 维护清单

Btrfs + Zstd 很适合服务器上的日志、归档、包缓存、容器层和普通业务文件：它能在透明压缩的同时保留子卷、快照、校验、Scrub 等能力。但 Btrfs 的空间表现和传统文件系统不同，不能只看 `df -h` 就下结论。

这篇笔记不是安装教程，而是一份维护清单：如何确认压缩是否生效、如何观察空间、何时执行 Scrub/Balance、如何管理快照，以及常见异常怎么排查。

::: warning 操作前提醒

- 涉及 `balance`、`defragment`、批量删除快照前，请确认备份可用。
- 磁盘空间已经非常紧张时，不要直接执行全量 `balance`。
- 数据库、虚拟机镜像、频繁写入的大文件目录，不建议随意做递归重压缩。

:::

## 快速检查

日常巡检先看这几条：

```bash
# 文件系统整体空间
df -h

# Btrfs 数据与元数据分配情况
btrfs filesystem usage -T /

# 挂载参数，确认是否启用 zstd
findmnt -no TARGET,OPTIONS -T /

# 设备错误计数
btrfs device stats /

# 最近的 Btrfs 错误日志
journalctl -b -p err | grep -i btrfs
```

如果机器运行 Docker，再补充：

```bash
docker system df
```

如果 `df -h` 看起来还有空间，但写入时报 `No space left on device`，优先看 `btrfs filesystem usage -T /` 中的 `Metadata` 和块组分配。

## 查看压缩状态

查看当前挂载是否启用压缩：

```bash
findmnt -no TARGET,OPTIONS -T /
findmnt -no TARGET,OPTIONS -T /var/lib
findmnt -no TARGET,OPTIONS -T /srv
```

常见结果：

| 挂载参数 | 含义 |
| --- | --- |
| `compress=zstd` | 启用 Zstd，未显式指定级别 |
| `compress=zstd:3` | 启用 Zstd，并指定压缩级别 3 |
| `compress-force=zstd` | 更积极地尝试压缩 |
| 没有 `compress` | 当前挂载未启用透明压缩 |

::: tip 多子卷环境要分别看

如果 `/`、`/var/lib`、`/srv` 是不同子卷或不同挂载点，只看根目录不够。关键业务目录都建议执行一次 `findmnt -T`。

:::

## 查看实际压缩效果

安装 `compsize`：

```bash
apt update
apt install -y compsize
```

查看目录压缩率：

```bash
compsize -x /var/log
compsize -x /srv/archive
```

用 Btrfs 自带命令查看目录占用：

```bash
btrfs filesystem du -s /var/log
btrfs filesystem du -s /srv/archive
```

两者分工：

| 工具 | 适合看什么 |
| --- | --- |
| `compsize -x` | 压缩前后大小、压缩算法、压缩率 |
| `btrfs filesystem du -s` | 逻辑占用、独占占用、共享占用 |
| `df -h` | 文件系统总体剩余空间 |

## Scrub：定期体检

Scrub 会读取数据和校验信息，用来发现静默损坏。单盘环境可以发现问题，多盘冗余环境还有机会修复问题。

```bash
# 前台执行并等待完成
btrfs scrub start -Bd /

# 查看状态
btrfs scrub status /
```

建议节奏：

- 普通个人服务器：每月一次。
- 数据较重要的服务器：按业务低峰期定期执行。
- 发现磁盘错误后：先看 SMART，再决定是否更换硬盘。

## Balance：空间重新分配

Balance 不是常规清理命令，它会重新整理 Btrfs 块组。删除大量数据、快照后，或者元数据紧张时可以温和执行。

```bash
# 温和整理数据和元数据块
btrfs balance start -dusage=50 -musage=50 /

# 查看状态
btrfs balance status /
```

只整理元数据：

```bash
btrfs balance start -musage=50 /
```

::: danger 不要无脑全量 balance

不建议直接执行：

```bash
btrfs balance start /
```

全量 Balance 可能持续很久，I/O 压力大，磁盘空间紧张时还可能让情况更糟。

:::

## 旧文件重新压缩

启用 `compress=zstd` 后，新写入文件会按挂载策略压缩；旧文件不会自动重写。对日志、归档、备份目录这类冷数据，可以按需重新压缩：

```bash
btrfs filesystem defragment -r -czstd /srv/archive
```

查看效果：

```bash
compsize -x /srv/archive
```

不建议对这些目录随意执行：

- 数据库目录。
- 虚拟机镜像目录。
- 正在频繁写入的大文件目录。
- 保留大量快照的目录。

原因是 defragment 会重写文件，可能增加写放大，也可能让快照占用突然变大。

## 快照管理

先查看子卷布局：

```bash
btrfs subvolume list /
btrfs subvolume list -t /
```

创建只读快照：

```bash
mkdir -p /.snapshots
btrfs subvolume snapshot -r / /.snapshots/root-$(date +%F-%H%M)
```

如果你的系统使用 `@`、`@home`、`@data` 这类子卷布局，请对具体子卷创建快照：

```bash
btrfs subvolume snapshot -r /@data /.snapshots/data-$(date +%F-%H%M)
```

::: tip 快照不是备份

快照适合本机快速回看和回滚，但它仍然在同一块磁盘上。误删、磁盘损坏、勒索加密、整机丢失时，快照不能替代异机备份。

:::

## 删除快照与回收空间

删除单个快照：

```bash
btrfs subvolume delete /.snapshots/root-2026-04-08-0100
btrfs subvolume sync /
```

检查快照下是否还有嵌套子卷：

```bash
btrfs subvolume list -o /.snapshots/root-2026-04-08-0100
```

删除大量快照后，可以执行温和 Balance：

```bash
btrfs balance start -dusage=50 -musage=50 /
```

空间没有立刻释放时，不一定是异常。Btrfs 的共享 Extent、快照引用和块组分配都会影响显示结果。

## 常见故障

### `No space left on device` 但 `df -h` 还有空间

```bash
btrfs filesystem usage -T /
btrfs balance start -dusage=50 -musage=50 /
```

如果元数据非常紧张，优先尝试：

```bash
btrfs balance start -musage=50 /
```

### 文件系统被只读挂载

```bash
mount | grep ' ro,'
journalctl -b | grep -i btrfs
btrfs device stats /
```

此时不要急着写入或强行修复，先确认磁盘健康和错误原因。

### 怀疑压缩没有生效

```bash
findmnt -no TARGET,OPTIONS -T /
compsize -x /path/to/check
```

确认该路径所在挂载点启用了 `compress=zstd`，并注意旧文件不会自动重新压缩。

### 怀疑磁盘硬件问题

```bash
apt install -y smartmontools
smartctl -a /dev/sda
```

设备名请按实际环境替换。NVMe 盘通常是 `/dev/nvme0n1`。

## 维护节奏

| 周期 | 建议动作 |
| --- | --- |
| 每日或变更后 | `df -h`、`btrfs filesystem usage -T /`、`btrfs device stats /` |
| 每周 | 检查 Docker、日志、包缓存增长 |
| 每月 | 执行 `btrfs scrub start -Bd /` |
| 删除大量数据后 | 温和 `balance` |
| 归档数据稳定后 | 按需 `defragment -r -czstd` |
| 重大升级前 | 创建只读快照并确认异机备份 |

## 一条实用原则

Btrfs 维护不要追求“每天都做很多事”。更稳的方式是：平时看占用、看错误、看快照数量；定期 Scrub；只有在删除大量数据、元数据紧张或空间分配失衡时再 Balance；只对冷数据做重压缩。
