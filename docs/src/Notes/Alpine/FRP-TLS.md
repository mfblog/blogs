---
title: "📤 FRP TLS 双向认证"
outline: deep
desc: "为 FRP 配置 CA、服务端证书、客户端证书与 transport TLS 双向认证"
tags: "FRP/TLS"
updateTime: "2025-02-19 14:06:32"
---

# 📤 FRP TLS 双向认证

FRP 默认已经可以通过 Token 做基础认证，但在公网环境中，仅依赖 Token 仍然不够稳妥。启用 TLS 双向认证后，服务端和客户端都需要出示由同一个 CA 签发的证书，能进一步降低未授权连接风险。

本文演示一套自签 CA 的配置流程：生成 CA、签发服务端证书、签发客户端证书，并在 `frps.toml` 与 `frpc.toml` 中启用 TLS。

::: warning 安全边界

CA 私钥是整套信任链的根。不要把 `ca.key` 放到 FRP 运行目录或同步到客户端。生产环境建议离线保存 CA 私钥，并为不同客户端签发独立证书。

:::

## 规划变量

请先替换下面几个值：

| 变量 | 示例 | 说明 |
| --- | --- | --- |
| FRP 服务域名 | `frp.example.com` | frps 对外访问域名 |
| 客户端标识 | `client-001` | 用于区分不同客户端证书 |
| 证书目录 | `/etc/frp/ssl` | FRP 读取证书的位置 |

后续命令以当前目录生成证书文件，部署时再复制到 `/etc/frp/ssl`。

## 生成 CA 证书

```bash
openssl genrsa -out ca.key 4096

openssl req -x509 -new -nodes \
  -key ca.key \
  -sha256 \
  -days 3650 \
  -subj "/CN=FRP Root CA" \
  -out ca.crt
```

建议限制私钥权限：

```bash
chmod 600 ca.key
```

## 签发服务端证书

生成服务端私钥：

```bash
openssl genrsa -out server.key 4096
```

创建证书请求：

```bash
openssl req -new \
  -key server.key \
  -subj "/CN=frp.example.com" \
  -out server.csr
```

创建 SAN 扩展文件：

```bash
cat >server.ext <<'EOF'
subjectAltName = DNS:frp.example.com
extendedKeyUsage = serverAuth
EOF
```

签发证书：

```bash
openssl x509 -req \
  -in server.csr \
  -CA ca.crt \
  -CAkey ca.key \
  -CAcreateserial \
  -days 825 \
  -sha256 \
  -extfile server.ext \
  -out server.crt
```

::: tip SAN 必须匹配

客户端连接时使用的域名，应出现在 `subjectAltName` 中。现代 TLS 校验通常不再只依赖 `CN`。

:::

## 签发客户端证书

```bash
openssl genrsa -out client.key 4096

openssl req -new \
  -key client.key \
  -subj "/CN=client-001" \
  -out client.csr
```

创建客户端扩展：

```bash
cat >client.ext <<'EOF'
extendedKeyUsage = clientAuth
EOF
```

签发证书：

```bash
openssl x509 -req \
  -in client.csr \
  -CA ca.crt \
  -CAkey ca.key \
  -CAcreateserial \
  -days 365 \
  -sha256 \
  -extfile client.ext \
  -out client.crt
```

## 证书部署目录

推荐目录结构：

```text
/etc/frp/ssl/
├── ca.crt
├── server.crt
├── server.key
├── client.crt
└── client.key
```

服务端只需要：

```text
ca.crt
server.crt
server.key
```

客户端只需要：

```text
ca.crt
client.crt
client.key
```

设置权限：

```bash
mkdir -p /etc/frp/ssl
chmod 700 /etc/frp/ssl
chmod 600 /etc/frp/ssl/*.key
chmod 644 /etc/frp/ssl/*.crt
```

## frps 服务端配置

```toml
# frps.toml
bindPort = 7000
auth.token = "replace-with-a-strong-token"

[transport]
tls.enable = true
tls.certFile = "/etc/frp/ssl/server.crt"
tls.keyFile = "/etc/frp/ssl/server.key"
tls.trustedCaFile = "/etc/frp/ssl/ca.crt"
```

如果启用了 FRP Dashboard，并且希望 Dashboard 自身也使用 TLS，再配置：

```toml
[webServer]
addr = "0.0.0.0"
port = 7500
user = "admin"
password = "replace-with-a-strong-password"
tls.certFile = "/etc/frp/ssl/server.crt"
tls.keyFile = "/etc/frp/ssl/server.key"
tls.trustedCaFile = "/etc/frp/ssl/ca.crt"
```

::: warning Dashboard 暴露提醒

Dashboard 不建议直接暴露到公网。至少要配置强密码、防火墙白名单，或放在内网/VPN 后面。

:::

## frpc 客户端配置

```toml
# frpc.toml
serverAddr = "frp.example.com"
serverPort = 7000
auth.token = "replace-with-a-strong-token"

[transport]
tls.enable = true
tls.certFile = "/etc/frp/ssl/client.crt"
tls.keyFile = "/etc/frp/ssl/client.key"
tls.trustedCaFile = "/etc/frp/ssl/ca.crt"
```

## 验证证书

检查服务端证书是否由 CA 签发：

```bash
openssl verify -CAfile ca.crt server.crt
```

检查客户端证书：

```bash
openssl verify -CAfile ca.crt client.crt
```

查看证书用途：

```bash
openssl x509 -in server.crt -noout -text | grep -A 2 "Extended Key Usage"
openssl x509 -in client.crt -noout -text | grep -A 2 "Extended Key Usage"
```

## 排障思路

- FRP 日志出现证书校验失败时，先确认客户端和服务端使用的是同一个 `ca.crt`。
- 域名校验失败时，检查 `server.crt` 的 SAN 是否包含当前连接域名。
- 私钥权限过宽时，部分部署规范会拒绝启动，建议 `.key` 使用 `600`。
- Token 仍然建议保留，它和 TLS 双向认证是两层保护。

## 维护建议

- 为每个客户端签发独立证书，丢失后只吊销或替换该客户端。
- 客户端证书有效期不要过长，可以按 90 天或 365 天轮换。
- CA 私钥离线保存，线上只保留 `ca.crt`。
- 证书文件变更后，重启 `frps` / `frpc` 并检查日志。
