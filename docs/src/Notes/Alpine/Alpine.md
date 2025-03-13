---
title: "📄 Alpine 笔记"
outline: deep
desc: "本文将介绍Alpine常用命令以及Alpine下Docker安装"
tags: "Alpine/Docker"
updateTime: "2024-12-19 08:06:32"
---

## 基础软件套装
::: tip 基础软件套装
推荐安装以下基础工具包，包含系统管理、网络调试等常用组件：
```bash
apk add openssh vim bash util-linux bash-doc bash-completion curl net-tools

:::

## 🐧 AlpineLinux 服务管理

::: tip 服务控制三连击
掌握OpenRC服务管理核心命令：
```bash
# 启动/重启/查看服务
rc-service {服务名} start      # 如 sshd/docker
rc-service {服务名} restart
rc-service {服务名} status

# 服务自启管理
rc-update add {服务名}        # 添加自启
rc-update del {服务名}        # 移除自启
rc-status -a                 # 查看所有服务状态

:::

## 🔐 SSH服务配置

::: warning 安全注意
生产环境建议创建专用运维账户，以下root登录方式仅限测试环境使用
:::

```bash
# 安装SSH服务套件
apk update && apk add openssh-server

# 服务生命周期管理
rc-service sshd start
rc-update add sshd

# 启用root登录（危险操作！）
echo 'PermitRootLogin yes' >> /etc/ssh/sshd_config
rc-service sshd restart
```

## 🐳 Docker生态安装
::: tip 镜像加速
建议在/etc/docker/daemon.json配置镜像加速源，例如：
```json
{
  "registry-mirrors": ["https://<your-mirror>"]
}
```
:::

```bash
# 启用社区仓库
sed -i '/community/s/^#//' /etc/apk/repositories

# 安装Docker组件
apk update && apk add docker
rc-update add docker boot && service docker start
```
## Docker Compose 部署
::: details 高级部署步骤
```bash
# 获取最新版（示例为v2.32.0）
curl -L https://github.com/docker/compose/releases/download/v2.32.0/docker-compose-linux-x86_64 \
  -o /usr/local/bin/docker-compose

# 权限设置
chmod +x /usr/local/bin/docker-compose
docker-compose --version
```
:::

::: warning 版本兼容性
建议保持Docker Compose与Docker版本匹配，可通过apk search docker-compose查看仓库可用版本
:::