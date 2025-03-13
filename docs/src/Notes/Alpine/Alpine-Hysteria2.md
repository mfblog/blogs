---
title: "📑 Alpine手动搭建Hysteria2"
outline: deep
desc: "本文将介绍Alpine手动搭建Hysteria2"
tags: "Alpine/Hysteria2"
updateTime: "2024-12-24 10:06:32"
---

## 核心组件安装

::: tip 核心组件安装
通过官方渠道获取最新版Hysteria核心程序：
```bash
# 下载二进制文件（跳过证书验证）
wget -O /usr/local/bin/hysteria https://download.hysteria.network/app/latest/hysteria-linux-amd64 --no-check-certificate

# 赋予执行权限
chmod +x /usr/local/bin/hysteria
```
:::

## 📁 目录结构准备
创建标准化配置存储路径：
```bash
mkdir -p /etc/hysteria/  # 配置文件主目录
```
## ⚙️ 核心配置详解

::: warning 关键参数说明
以下配置需根据实际网络环境调整，红色标注部分为必填项
:::

```yaml
# /etc/hysteria/config.yaml
listen: :433  # 服务监听端口

acme:
  domains:
    - "your.domain.com"  # 替换为已解析的域名
  email: admin@example.com  # 证书通知邮箱
  type: dns
  dns:
    name: cloudflare
    config:
      cloudflare_api_token: "your_cloudflare_token"  # CF令牌

auth:
  type: password
  password: "secure_password_here"  # 认证密码
  
masquerade:
  type: proxy
  proxy:
    url: https://bing.com  # 流量伪装地址
    rewriteHost: true
```

::: details 高级服务配置
OpenRC服务文件/etc/init.d/hy2配置说明：

```bash
#!/sbin/openrc-run
name="hysteria"
command="/usr/local/bin/hysteria"
command_args="server --config /etc/hysteria/config.yaml"  # 指定配置文件
pidfile="/var/run/$${name}.pid"
command_background="yes"
depend() {
    need networking  # 网络依赖
}
```
:::

## 🚀 服务生命周期管理
::: tip 服务控制三板斧

```bash
# 注册系统服务
rc-update add hy2

# 启动服务（首次运行）
service hy2 start

# 后续管理命令
service hy2 restart  # 重启
service hy2 status   # 状态查询
service hy2 stop     # 停止
```

:::

::: warning 部署验证要点
1.确认防火墙放行UDP 433端口<br>
2.检查Cloudflare DNS解析生效<br>
3.验证证书自动签发状态（查看/var/log/hysteria.log）<br>
4.客户端连接测试建议使用hysteria官方客户端
:::