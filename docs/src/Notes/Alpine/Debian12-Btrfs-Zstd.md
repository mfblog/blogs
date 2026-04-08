---
title: "🗂️ Debian 服务器 Btrfs + Zstd 维护清单"
outline: deep
desc: "面向 Debian 服务器场景的 Btrfs + Zstd 日常维护、压缩级别检查、compsize 使用、快照管理与删除清单"
tags: "Debian/Btrfs/Zstd/服务器"
updateTime: "2026-04-08 09:16:00"
---

# 🗂️ Debian 服务器 Btrfs + Zstd 维护清单

## 概述

::: info 适用场景

本文面向 **已经部署好 Btrfs + Zstd 的 Debian 服务器**，重点不是安装，而是后续的 **日常检查、压缩状态确认、快照管理、快照删除与空间回收**。

:::

::: warning 操作权限

本文默认在 **root 用户** 下执行；若使用普通用户，请在相关命令前加 `sudo`。

:::

::: warning 维护前建议

- 涉及 `balance`、批量整理、快照清理前，建议先确认备份可用。
- 磁盘空间已经非常紧张时，不要直接做全量整理或大规模快照操作。
- 生产环境优先低峰期执行维护命令。

:::

## 1. 当前压缩状态与级别检查

::: tip 查看当前挂载压缩参数

```bash
# 查看根分区当前挂载参数
findmnt -no TARGET,OPTIONS -T /

# 查看特定业务目录所在挂载点的参数
findmnt -no TARGET,OPTIONS -T /var/lib
findmnt -no TARGET,OPTIONS -T /srv
```

:::

::: warning 怎么看压缩级别

- 如果输出里直接有 `compress=zstd:1`、`compress=zstd:3`、`compress=zstd:15`，这就是当前挂载正在使用的压缩级别。
- 如果只看到 `compress=zstd`，说明启用了 `zstd`，但当前挂载参数里没有显式展示等级。
- 多子卷、多挂载点场景下，建议分别对关键路径执行一次 `findmnt -T`，不要只看 `/`。

:::

::: tip 查看实际压缩效果

```bash
# 查看某个目录的逻辑占用与实际占用
btrfs filesystem du -s /var/log
btrfs filesystem du -s /srv/archive

# 直接用 compsize 查看压缩率
compsize -x /var/log
compsize -x /srv/archive
```

:::

::: tip 你的环境里优先看什么

- 既然服务器上已经装了 `compsize`，日常判断压缩是否有效时，优先看 `compsize -x 路径`。
- `btrfs filesystem du -s` 更适合看目录的逻辑占用、独占占用和共享占用。
- 两者结合看，比单独看 `df -h` 更接近真实情况。

:::

## 2. 日常检查清单

::: tip 建议每日或变更后检查

```bash
# 磁盘整体占用
df -h

# Btrfs 数据/元数据占用
btrfs filesystem usage -T /

# APT 缓存占用
du -sh /var/cache/apt/archives

# Docker 缓存与镜像/容器/卷占用
docker system df

# 检查设备错误计数
btrfs device stats /

# 查看最近启动以来的 Btrfs 相关报错
journalctl -b -p err | grep -i btrfs

# 内核日志快速检查
dmesg | grep -i btrfs | tail -20
```

:::

::: warning 重点关注

- `Data` 和 `Metadata` 不要长期逼近满载。
- `apt` 缓存长期过大，通常说明包缓存没有定期清理。
- `docker system df` 如果 `Images`、`Containers`、`Local Volumes` 持续增长，要尽快确认是否存在无用镜像或悬空层。
- `btrfs device stats` 若持续出现读写或校验错误，应优先排查磁盘健康。
- `df -h` 仍有空间但 Btrfs 写不进去，通常是 **元数据块不足** 或 **数据块分配失衡**。

:::

::: tip 补充说明

- 未安装 Docker 或这台机器不跑容器时，可以跳过 `docker system df`。
- 如果 `du -sh /var/cache/apt/archives` 明显偏大，后续可结合 `apt clean` 做缓存清理。

:::

## 3. 周期性维护命令

::: code-group

```bash[Scrub（建议每月）]
# 前台执行并等待完成
btrfs scrub start -Bd /

# 查看 scrub 状态
btrfs scrub status /
```

```bash[Balance（按需执行）]
# 仅整理使用率较低的数据/元数据块，避免全盘 balance
btrfs balance start -dusage=75 -musage=75 /

# 查看 balance 状态
btrfs balance status /
```

```bash[只做元数据回收]
# 磁盘未满但元数据紧张时优先尝试
btrfs balance start -musage=50 /
```

:::

::: warning 执行原则

- 不建议无差别执行 `btrfs balance start /` 全量平衡。
- `scrub` 适合定期做；`balance` 更适合在空间分布失衡、删除大量数据、元数据紧张后执行。
- 生产环境建议在低峰期运行，并观察 `iowait` 与业务延迟。

:::

## 4. Zstd 压缩维护

::: tip 重点理解

- 已启用 `compress=zstd` 后，**新写入数据** 会按当前策略尝试压缩。
- **旧文件不会自动重新压缩**，需要通过整理重写。
- 维护时重点是区分“适合重压缩的冷数据”和“不适合动的热数据”。

:::

::: code-group

```bash[查看目录实际压缩情况]
# Btrfs 自带视角
btrfs filesystem du -s /var/log

# compsize 视角更直观
compsize -x /var/log
```

```bash[对旧数据重新压缩]
# 仅适合日志、备份、归档目录等静态数据
btrfs filesystem defragment -r -czstd /var/log
```

:::

::: warning 不要滥用整理

- `defragment -r -czstd` 会重写文件，可能放大写入。
- 对数据库目录、虚拟机镜像、频繁变更的大文件通常不建议执行。
- 如果系统保留大量快照，整理会增加额外空间占用，应先评估快照数量。

:::

## 5. 快照管理与使用

::: tip 先看当前子卷和快照布局

```bash
# 查看全部子卷
btrfs subvolume list /

# 带表格信息查看
btrfs subvolume list -t /
```

:::

::: warning 快照的基本原则

- 快照是基于 **子卷** 的，不是普通目录级复制。
- 建议对系统子卷、业务数据子卷分开管理，不要所有内容混在一个大子卷里。
- 服务器场景通常优先使用 **只读快照**，更安全，也更适合备份和回滚前留档。

:::

::: code-group

```bash[创建只读快照（常见 @ 布局示例）]
# 根子卷快照
btrfs subvolume snapshot -r /@ /@snapshots/root-$(date +%F-%H%M)

# 数据子卷快照
btrfs subvolume snapshot -r /@data /@snapshots/data-$(date +%F-%H%M)
```

```bash[创建可写快照（用于临时恢复测试）]
btrfs subvolume snapshot /@snapshots/root-2026-04-08-0100 /@restore-test
```

:::

::: tip 快照怎么用

- 回看历史文件：直接从快照路径中读取或复制目标文件。
- 回滚前验证：先从只读快照克隆出一个可写子卷做测试，不要直接在生产根子卷上操作。
- 配合备份：快照适合做“本机时间点保留”，不等于异机备份。

:::

## 6. 快照删除与空间回收

::: tip 删除快照的标准流程

```bash
# 查看快照列表
btrfs subvolume list /

# 删除单个快照
btrfs subvolume delete /@snapshots/root-2026-04-08-0100

# 等待删除事务完成
btrfs subvolume sync /
```

:::

::: warning 删除快照时要注意

- 如果快照下面还有嵌套子卷，需要先删子卷，再删父快照。
- 快照删除后，空间通常不会像 `ext4` 一样立刻直观释放。
- 删除了大量快照后，可以做一次温和 `balance` 帮助回收块组。

:::

::: code-group

```bash[检查某个快照下是否还有嵌套子卷]
btrfs subvolume list -o /@snapshots/root-2026-04-08-0100
```

```bash[删除大量快照后做一次温和平衡]
btrfs balance start -dusage=50 -musage=50 /
```

:::

::: tip 建议的快照保留思路

- 系统子卷：保留最近几天的日快照，再加少量周快照。
- 数据子卷：按业务恢复点目标保留，不要机械照搬系统快照频率。
- 高变化目录：快照过密会放大空间压力，应结合实际写入量调整。

:::

## 7. 常见问题排查

::: warning 常见问题

### 系统只读挂载

```bash
mount | grep ' ro,'
journalctl -b | grep -i btrfs
btrfs device stats /
```

### `No space left on device` 但 `df -h` 还有空间

```bash
btrfs filesystem usage -T /
btrfs balance start -dusage=50 -musage=50 /
```

### 怀疑压缩没有生效

```bash
findmnt -no TARGET,OPTIONS -T /

# 直接看压缩结果
compsize -x /
```

### 排查磁盘底层健康问题

```bash
apt install -y smartmontools
smartctl -a /dev/sda
```

:::

## 8. 建议的维护节奏

::: details 服务器实践清单

```bash
# 每日
df -h
btrfs filesystem usage -T /
btrfs device stats /

# 每月
btrfs scrub start -Bd /

# 删除大量数据/快照后
btrfs balance start -dusage=50 -musage=50 /

# 归档目录需要重新压缩时
btrfs filesystem defragment -r -czstd /path/to/archive

# 快照管理
btrfs subvolume list -t /
btrfs subvolume sync /
```

:::

::: tip 总结建议

- 日常维护核心是四件事：**看占用、看错误、看压缩、看快照数量**。
- `scrub` 是体检，`balance` 是调仓，`defragment` 是重写压缩，快照删除后通常还要结合空间回收观察。
- 快照适合保留恢复点，但不能代替独立备份；保留过多反而会拖累空间与维护成本。

:::
