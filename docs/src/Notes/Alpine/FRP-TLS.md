---
title: "📤 FRP TLS双向认证"
outline: deep
desc: "本文将介绍FRP TLS双向认证"
tags: "FRP/TLS"
updateTime: "2025-02-19 14:06:32"
---

## TLS双向认证核心流程

::: tip TLS双向认证核心流程
FRP实现双向认证需完成CA证书链构建、服务端/客户端证书签发、配置文件适配三大核心步骤。以下为标准化操作流程
:::

## 🔐 证书生成体系

### 一、CA根证书构建（信任链基础）
::: warning 安全警告
CA私钥是信任链核心，必须离线存储并设置访问权限
:::

```bash
# 生成2048位RSA密钥
openssl genrsa -out ca.key 2048

# 创建自签名根证书（有效期10年）
openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 \
  -subj "/CN=FastFRP Root CA" -out ca.crt
```

### 二、服务端证书签发
::: details SAN扩展必要性
必须包含服务域名防止证书校验失败
:::

```bash
# 生成服务端密钥
openssl genrsa -out server.key 2048

# 创建证书请求（CN需匹配服务域名）
openssl req -new -key server.key \
  -subj "/CN=frp.ccya.top" -out server.csr

# 签发含SAN扩展的证书
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key \
  -CAcreateserial -days 3650 -sha256 \
  -extfile <(printf "subjectAltName=DNS:frp.ccya.top") \
  -out server.crt
```

### 三、客户端证书签发
```bash
# 生成客户端密钥
openssl genrsa -out client.key 2048

# 创建证书请求（客户端标识建议唯一）
openssl req -new -key client.key \
  -subj "/CN=client-001" -out client.csr

# 签发客户端证书
openssl x509 -req -in client.csr -CA ca.crt -CAkey ca.key \
  -CAcreateserial -days 3650 -sha256 -out client.crt
```
## 📁 证书文件体系
```bash
TLS_CERTIFICATES/
├── ca/
│   ├── ca.crt       # 根证书（分发各节点）
│   └── ca.key       # CA私钥（绝密存储）
├── server/
│   ├── server.crt   # 服务端证书（含SAN）
│   └── server.key   # 服务端私钥
└── client/
    ├── client.crt   # 客户端证书
    └── client.key   # 客户端私钥
```

## ⚙️ FRP服务端配置
::: danger 关键配置项
必须同时配置transport和webServer的TLS参数
:::

```toml
# frps.toml
[webServer]
tls.certFile = "/etc/frp/ssl/server.crt"
tls.keyFile = "/etc/frp/ssl/server.key"
tls.trustedCaFile = "/etc/frp/ssl/ca.crt"

[transport]
tls.enable = true
tls.certFile = "/etc/frp/ssl/server.crt"
tls.keyFile = "/etc/frp/ssl/server.key"
tls.trustedCaFile = "/etc/frp/ssl/ca.crt"
```
## 🖥️ FRP客户端配置
```toml
# frpc.toml
[transport]
tls.enable = true
tls.certFile = "/etc/frp/ssl/client.crt"
tls.keyFile = "/etc/frp/ssl/client.key"
tls.trustedCaFile = "/etc/frp/ssl/ca.crt"
```
::: tip 部署验证步骤
- 检查证书链完整性：openssl verify -CAfile ca.crt server.crt
- 测试双向认证：curl --cert client.crt --key client.key --cacert ca.crt https://frp.ccya.top
- 查看FRP日志确认TLS握手成功
:::

## 🛡️ 安全增强建议
- 定期轮换客户端证书（建议90天有效期）
- 为不同客户端颁发独立证书
- 在防火墙限制CA证书指纹白名单
- 启用OCSP装订提升验证效率
- 使用HSM保护CA私钥存储