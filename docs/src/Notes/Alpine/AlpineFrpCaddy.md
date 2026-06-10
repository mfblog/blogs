---
title: "↔️ 内网穿透终解(一)"
outline: deep
desc: "在阿里云导入 Alpine 自定义镜像，为 FRP 与 Caddy 部署准备轻量 ECS"
tags: "阿里云/Frp/Caddy"
updateTime: "2024-12-12 13:06:32"
---

# ↔️ 内网穿透终解(一)

这组文章记录一套轻量内网穿透方案：云端使用 Alpine ECS 作为入口节点，FRP 负责隧道，Caddy 负责反向代理和 HTTPS。

第一篇聚焦云服务器准备：为什么选择按量 ECS、如何导入 Alpine 镜像，以及首次启动后要做哪些安全初始化。

## 方案背景

阿里云 CDT 计费规则提供一定额度的免费流量。对于个人或轻量服务，可以使用按量付费 ECS 搭配较高带宽，在不用时释放实例或降低配置，以控制成本。

::: tip 适合场景

- 家庭服务临时暴露到公网。
- 个人项目演示环境。
- 小流量 Webhook、面板、下载站入口。
- 希望用更轻量系统减少云服务器资源占用。

:::

## 整体拓扑

```text
公网用户
  |
  | HTTPS
  v
阿里云 ECS（Alpine + Caddy + frps）
  |
  | FRP 隧道
  v
内网机器（frpc + 本地服务）
```

云端节点需要开放：

| 端口 | 用途 |
| --- | --- |
| `22/tcp` | SSH 管理 |
| `80/tcp` | Caddy 申请证书与 HTTP 入口 |
| `443/tcp` | HTTPS 入口 |
| `7000/tcp` | FRP 控制连接，按配置调整 |
| `7500/tcp` | FRP Dashboard，可选且不建议公网开放 |

## 导入 Alpine 镜像

### 上传镜像到 OSS

1. 下载或准备 `.vhd` 镜像文件。
2. 上传到与 ECS 同地域的 OSS Bucket。
3. OSS Bucket 可以保持私有，不需要公开读。
4. 在对象详情中复制文件 URL。

镜像下载地址：

[Alpine 镜像下载](https://wwsb.lanzoul.com/iDFCw2hwjt8d)

### 在 ECS 导入镜像

1. 进入 ECS 控制台。
2. 切换到目标地域。
3. 打开“镜像”页面。
4. 选择“导入镜像”。
5. 填入 OSS 文件 URL。
6. 按向导完成导入。

::: warning 镜像信息

原始镜像信息如下，请首次开机后立即修改密码：

- Alpine 版本：`3.20.2`
- 根目录可用空间：约 `823.5M`
- 默认 SSH 端口：`22`
- 默认用户：`root`
- 默认密码：请以镜像发布说明为准，首次登录后必须修改

:::

## 首次启动后初始化

登录后先修改 root 密码：

```bash
passwd
```

更新软件源并安装基础工具：

```bash
apk update
apk add openssh vim bash curl wget ca-certificates
```

确认 SSH 服务：

```bash
rc-service sshd status
rc-update add sshd default
```

建议创建 SSH 密钥登录后，禁用密码登录：

```ini
PermitRootLogin prohibit-password
PasswordAuthentication no
PubkeyAuthentication yes
```

重启 SSH：

```bash
rc-service sshd restart
```

## 安全组建议

- `22/tcp` 尽量限制为自己的固定 IP。
- `7000/tcp` 只允许内网客户端出口 IP 访问。
- `7500/tcp` Dashboard 不建议对公网开放。
- `80/tcp` 和 `443/tcp` 对公网开放，用于 Caddy Web 入口。

## 镜像与控制台截图

以下截图用于记录导入流程与 ECS 创建过程。

![更新 Alpine](/update-alpine.png)
![导入镜像](/daoru-images.png)
![镜像步骤 1](/image1.png)
![镜像步骤 2](/image2.png)
![服务器配置 1](/server1.png)
![服务器配置 2](/server2.png)
![服务器配置 3](/server3.png)

下一篇继续配置 FRP 服务端与 Caddy 反向代理。
