---
title: "🛠️ Docker Inspect 实用手册"
outline: deep
desc: "docker inspect 的网络、挂载、资源、健康检查与批量排障模板"
tags: "Docker/Troubleshooting"
updateTime: "2025-11-07 15:58:00"
---

# 🛠️ Docker Inspect 实用手册

`docker inspect` 输出的是 Docker 对象的完整 JSON 元数据。容器启动失败、端口不通、环境变量缺失、挂载路径错误、资源限制异常时，它经常比猜配置更直接。

这篇笔记按排障场景整理常用查询模板。

## 使用方式速览

```bash
# 查看完整 JSON
docker inspect my-nginx | less

# 用 Go template 提取字段
docker inspect -f '{{.State.Status}}' my-nginx

# 用 jq 读取结构化字段
docker inspect my-nginx | jq '.[0].NetworkSettings'
```

::: tip 选择建议

- 临时看单个字段：用 `-f`。
- 分析复杂结构：用 `jq`。
- 对比两个容器：导出 JSON 后 `diff`。

:::

## 基础状态

```bash
# 运行状态、启动时间、退出码
docker inspect -f '{{.State.Status}}' my-nginx
docker inspect -f '{{.State.StartedAt}}' my-nginx
docker inspect -f '{{.State.ExitCode}}' my-nginx

# 重启次数与日志路径
docker inspect -f '{{.RestartCount}}' my-nginx
docker inspect -f '{{.LogPath}}' my-nginx

# 镜像 ID 与启动命令
docker inspect -f '{{.Image}}' my-nginx
docker inspect my-nginx | jq '.[0].Config.Cmd'
```

排障时通常先配合：

```bash
docker logs --tail=100 my-nginx
docker ps -a
```

## 网络与端口

查看容器在所有网络中的 IP：

```bash
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{"\n"}}{{end}}' my-nginx
```

查看指定网络：

```bash
docker inspect -f '{{.NetworkSettings.Networks.bridge.IPAddress}}' my-nginx
```

查看网关、MAC 和端口映射：

```bash
docker inspect -f '{{range .NetworkSettings.Networks}}{{.Gateway}}{{"\n"}}{{end}}' my-nginx
docker inspect -f '{{range .NetworkSettings.Networks}}{{.MacAddress}}{{"\n"}}{{end}}' my-nginx
docker inspect -f '{{.NetworkSettings.Ports}}' my-nginx
```

用 `jq` 查看更清楚：

```bash
docker inspect my-nginx | jq '.[0].NetworkSettings.Networks'
docker inspect my-nginx | jq '.[0].NetworkSettings.Ports'
```

## DNS 与 Hosts

```bash
docker inspect -f '{{.HostConfig.Dns}}' my-nginx
docker inspect -f '{{.HostConfig.ExtraHosts}}' my-nginx
docker inspect my-nginx | jq '.[0].HostConfig.Dns'
```

如果容器内域名解析异常，继续进入容器检查：

```bash
docker exec -it my-nginx cat /etc/resolv.conf
docker exec -it my-nginx getent hosts example.com
```

## 挂载与数据卷

```bash
# 简洁列出挂载关系
docker inspect -f '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}' my-nginx

# 查看完整挂载信息
docker inspect my-nginx | jq '.[0].Mounts'

# 查看绑定挂载和卷配置
docker inspect my-nginx | jq '.[0].HostConfig.Binds'
```

如果应用读不到文件，优先确认：

- 宿主机路径是否存在。
- 容器内目标路径是否正确。
- 挂载是否只读。
- UID/GID 权限是否匹配。

## 环境变量

```bash
docker inspect -f '{{.Config.Env}}' my-nginx
docker inspect my-nginx | jq '.[0].Config.Env'
```

查找某个变量：

```bash
docker inspect my-nginx | jq -r '.[0].Config.Env[]' | grep '^MYSQL_'
```

::: warning 敏感信息

`docker inspect` 可能显示数据库密码、Token、访问密钥等敏感信息。不要把完整输出直接贴到公开 Issue、博客或聊天记录里。

:::

## 资源限制

```bash
# 内存限制，单位为字节
docker inspect -f '{{.HostConfig.Memory}}' my-nginx

# 转成 MB
docker inspect my-nginx | jq '.[0].HostConfig.Memory / 1024 / 1024'

# CPU 限制
docker inspect -f '{{.HostConfig.NanoCpus}}' my-nginx

# 内存保留
docker inspect -f '{{.HostConfig.MemoryReservation}}' my-nginx
```

资源排障通常配合：

```bash
docker stats my-nginx
dmesg | grep -i oom
```

## 健康检查

```bash
# 健康检查定义
docker inspect -f '{{.Config.Healthcheck}}' my-nginx

# 当前健康状态
docker inspect -f '{{.State.Health.Status}}' my-nginx

# 最近一次健康检查日志
docker inspect my-nginx | jq '.[0].State.Health.Log[-1]'
```

没有健康检查的容器，`.State.Health` 可能为空，这是正常情况。

## 批量查看

所有运行中容器的名称、状态和 IP：

```bash
docker ps -q | xargs -I {} docker inspect -f '{{.Name}} {{.State.Status}} {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' {}
```

所有容器状态：

```bash
docker ps -aq | xargs docker inspect -f '{{.Name}} {{.State.Status}} {{.RestartCount}}'
```

## 导出配置对比

```bash
docker inspect c1 > c1.json
docker inspect c2 > c2.json
diff c1.json c2.json
```

只对比容器配置：

```bash
diff <(docker inspect c1 | jq '.[0].Config') \
     <(docker inspect c2 | jq '.[0].Config')
```

只对比宿主机配置：

```bash
diff <(docker inspect c1 | jq '.[0].HostConfig') \
     <(docker inspect c2 | jq '.[0].HostConfig')
```

## 一键诊断脚本

```bash
#!/bin/bash
set -euo pipefail

CONTAINER="${1:?用法: $0 <container>}"

docker inspect -f '名称: {{.Name}}' "$CONTAINER"
docker inspect -f '状态: {{.State.Status}}' "$CONTAINER"
docker inspect -f '退出码: {{.State.ExitCode}}' "$CONTAINER"
docker inspect -f '重启次数: {{.RestartCount}}' "$CONTAINER"
docker inspect -f 'IP: {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$CONTAINER"
docker inspect -f '端口: {{.NetworkSettings.Ports}}' "$CONTAINER"
docker inspect -f '内存限制: {{.HostConfig.Memory}}' "$CONTAINER"
docker inspect -f 'CPU 限制: {{.HostConfig.NanoCpus}}' "$CONTAINER"
docker inspect -f '日志路径: {{.LogPath}}' "$CONTAINER"
```

## 排障顺序建议

1. `docker ps -a` 看容器是否运行、是否反复重启。
2. `docker logs` 看业务报错。
3. `docker inspect` 查网络、端口、挂载、环境变量和资源限制。
4. `docker exec` 进入容器做连通性或文件权限检查。
5. 仍然无法定位时，再看宿主机防火墙、DNS、磁盘和内核日志。

把常用模板保存下来，遇到 IP 冲突、端口没暴露、环境变量缺失、数据卷没挂上这类问题时，可以少绕很多路。
