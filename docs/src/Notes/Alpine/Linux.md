---
title: "🐧 Linux 笔记"
outline: deep
desc: "本文将介绍Linux常用命令以及Docker安装"
tags: "Linux/Docker"
updateTime: "2024-12-12 09:06:32"
---

## 系统基础配置
::: tip 系统基础配置
语言环境设置 - 配置中文支持环境：
```bash
# 配置系统级语言包
dpkg-reconfigure locales  # 选择zh_CN.UTF-8编码

# 设置环境变量
export LANG="zh_CN.UTF-8"
export LANGUAGE="zh_CN:zh"
export LC_ALL="zh_CN.UTF-8"
```

:::

## 🐳 Docker 部署方案
::: warning 镜像加速必选
推荐使用国内镜像源提升下载速度
:::

### 核心组件安装
```bash
# 一键安装脚本（阿里云镜像源）
curl -fsSL https://gitee.com/tech-shrimp/docker_installer/releases/download/latest/linux.sh | bash -s docker --mirror Aliyun
```

### 镜像源优化配置
```bash
# 创建镜像加速配置文件
tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://hub.geekery.cn/",
    "https://ghcr.geekery.cn"
  ]
}
EOF

# 重启服务生效
systemctl restart docker
```
## 📁 NFS 共享服务部署
### 服务端配置流程
::: danger 权限管理要点
共享目录必须设置nobody权限避免挂载冲突
:::

1.基础环境准备：
```bash
apt update && apt install -y nfs-kernel-server
systemctl status nfs-mountd.service  # 验证服务状态
```
2.共享目录设置：
```bash
mkdir -p /mnt/nfs
chown nobody:nogroup /mnt/nfs  # 关键权限设置
```
3.导出规则配置：
```bash
# 编辑/etc/exports文件添加：
/mnt/nfs 192.168.100.0/24(rw,async,no_subtree_check,no_root_squash)

# 应用配置
systemctl restart nfs-kernel-server.service
```

## 客户端挂载指南
::: details 持久化挂载配置
通过fstab实现开机自动挂载
:::

## 临时挂载命令：
```bash
mount -t nfs 192.168.100.88:/mnt/nfs /mnt/nfs
```
## 永久挂载配置：
```bash
# 编辑/etc/fstab添加：
192.168.100.88:/mnt/nfs  /mnt/nfs  nfs  defaults,_netdev  0 0

# 重载配置
systemctl daemon-reload
mount -a  # 测试挂载
```
::: tip 网络优化建议
- 建议配置静态IP确保服务稳定性
- 跨网段访问需调整子网掩码范围
- 大数据传输推荐使用async参数提升性能
:::