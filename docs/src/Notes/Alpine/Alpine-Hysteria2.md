---
title: "📑 Alpine手动搭建Hysteria2"
outline: deep
desc: "本文将介绍Alpine手动搭建Hysteria2"
tags: "Alpine/Hysteria2"
updateTime: "2024-12-24 10:06:32"
---

## 下载并安装 Hysteria
```bash
wget -O /usr/local/bin/hysteria https://download.hysteria.network/app/latest/hysteria-linux-amd64  --no-check-certificate
```
```bash
chmod +x /usr/local/bin/hysteria
```
## 创建目录 /etc/hysteria/ 用于存放配置文件
```bash
mkdir -p /etc/hysteria/
```
## 创建 /etc/hysteria/config.yaml 配置文件
```yaml
listen: :433 #监听端口

acme:
  domains:
    - "你的已经绑定服务器ip的域名"
  email: your@email.address
  type: dns
  dns:
    name: cloudflare
    config:
      cloudflare_api_token: Cloudflare 用户 Api 令牌

auth:
  type: password
  password: your_password #设置认证密码
  
masquerade:
  type: proxy
  proxy:
    url: https://bing.com #伪装网址
    rewriteHost: true
```
## 创建 /etc/init.d/hy2 系统服务配置文件
```bash
#!/sbin/openrc-run

name="hysteria"

command="/usr/local/bin/hysteria"
command_args="server --config /etc/hysteria/config.yaml"

pidfile="/var/run/${name}.pid"

command_background="yes"

depend() {
        need networking
}
```
## 设置 Hysteria2 自启动
```bash
rc-update add hy2
```
## 启动 Hysteria2 服务
```bash
service hysteria start
```