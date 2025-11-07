---
title: "🛠️ Docker Inspect 实用手册"
outline: deep
desc: "Docker inspect 的排障技巧与常用模板"
tags: "Docker/Troubleshooting"
updateTime: "2025-11-07 15:58:00"
---

`docker inspect` 输出看似繁琐，但它是排查网络、配置、资源异常时最直接的“真相仪”。这篇笔记把实战中最常用的查询方式整理成模块化命令，保持与 Debian 12 指南一致的段落与提示样式，复制即用。

## 使用前速览

::: tip 推荐执行方式

- 默认输出是 JSON，可结合 `less`、`grep` 或 `jq` 过滤。
- `-f` 选项支持 Go 模板，直接提取字段最省时。
- `docker inspect <容器|镜像>` 与 `docker inspect -f '{{...}}' <容器>` 是两种常见形态。
  :::

## 1. 基础信息查询

### 查看容器或镜像详情

```bash
# 容器完整信息
docker inspect my-nginx | less

# 镜像拓扑（含分层）
docker inspect nginx:latest | grep Layers -A 20
```

### 抽取常见字段

```bash
# 运行状态 / 启动时间 / 退出码
docker inspect -f '{{.State.Status}}' my-nginx
docker inspect -f '{{.State.StartedAt}}' my-nginx
docker inspect -f '{{.State.ExitCode}}' my-nginx

# 镜像 ID 与启动命令
docker inspect -f '{{.Image}}' my-nginx
docker inspect nginx:latest | jq '.[0].Config.Cmd'
```

## 2. 网络与端口

### 获取 IP、网关、MAC

```bash
# 默认网络 IP
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' my-nginx

# 指定网桥
docker inspect -f '{{.NetworkSettings.Networks.bridge.IPAddress}}' my-nginx

# 网关 / MAC
docker inspect -f '{{range .NetworkSettings.Networks}}{{.Gateway}}{{end}}' my-nginx
docker inspect -f '{{range .NetworkSettings.Networks}}{{.MacAddress}}{{end}}' my-nginx
```

### 端口与 DNS

```bash
# 端口映射概览
docker inspect -f '{{.NetworkSettings.Ports}}' my-nginx

# 查看 DNS / hosts
docker inspect -f '{{.HostConfig.Dns}}' my-nginx
docker inspect -f '{{.HostConfig.ExtraHosts}}' my-nginx
```

## 3. 数据卷与环境变量

```bash
# 列出挂载点
docker inspect -f '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}' my-nginx

# jq 查看详细挂载
docker inspect my-nginx | jq '.[0].Mounts'

# 环境变量
docker inspect -f '{{.Config.Env}}' my-nginx
docker inspect my-nginx | jq '.[0].Config.Env'
docker inspect my-nginx | grep MYSQL_ROOT_PASSWORD
```

## 4. 资源限制

```bash
# 内存限制（字节）
docker inspect -f '{{.HostConfig.Memory}}' my-nginx

# 转成 MB
docker inspect my-nginx | jq '.[0].HostConfig.Memory / 1024 / 1024'

# CPU / 内存保留
docker inspect -f '{{.HostConfig.NanoCpus}}' my-nginx
docker inspect -f '{{.HostConfig.MemoryReservation}}' my-nginx
```

## 5. 批量与脚本技巧

### 批量查看 IP、状态

```bash
# 所有容器 IP
docker ps -q | xargs -I {} docker inspect -f '{{.Name}} {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' {}

# 所有容器状态
docker ps -aq | xargs docker inspect -f '{{.Name}} {{.State.Status}}'
```

### 导出配置对比

```bash
docker inspect c1 > c1.json
docker inspect c2 > c2.json
diff c1.json c2.json

# 用 jq 对比特定字段
diff <(docker inspect c1 | jq '.[0].Config') \
     <(docker inspect c2 | jq '.[0].Config')
```

## 6. 健康检查与监控

```bash
# 健康检查定义与结果
docker inspect -f '{{.Config.Healthcheck}}' opsnot-kafka
docker inspect -f '{{.State.Health.Status}}' opsnot-kafka
docker inspect opsnot-kafka | jq '.[0].State.Health.Log[-1]'

# 监控脚本示例
#!/bin/bash
for c in $(docker ps -q); do
  name=$(docker inspect -f '{{.Name}}' "$c")
  status=$(docker inspect -f '{{.State.Status}}' "$c")
  restarts=$(docker inspect -f '{{.RestartCount}}' "$c")
  memory=$(docker inspect -f '{{.HostConfig.Memory}}' "$c")
  echo "容器: $name"
  echo " 状态: $status"
  echo " 重启次数: $restarts"
  echo " 内存限制: $((memory/1024/1024))MB"
  echo "---"
done
```

## 7. 组合命令速查

```bash
# 故障诊断一键脚本
#!/bin/bash
CONTAINER=$1
docker inspect -f '名称: {{.Name}}' "$CONTAINER"
docker inspect -f '状态: {{.State.Status}}' "$CONTAINER"
docker inspect -f '退出码: {{.State.ExitCode}}' "$CONTAINER"
docker inspect -f '重启次数: {{.RestartCount}}' "$CONTAINER"
docker inspect -f 'IP: {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$CONTAINER"
docker inspect -f '端口: {{.NetworkSettings.Ports}}' "$CONTAINER"
docker inspect -f '内存限制: {{.HostConfig.Memory}}' "$CONTAINER"
docker inspect -f 'CPU限制: {{.HostConfig.NanoCpus}}' "$CONTAINER"
docker inspect -f '日志路径: {{.LogPath}}' "$CONTAINER"
```

## 8. 导出配置报告

```bash
docker inspect ops-not-nginx | jq '{
  Name: .[0].Name,
  Status: .[0].State.Status,
  Image: .[0].Config.Image,
  IP: .[0].NetworkSettings.IPAddress,
  Ports: .[0].NetworkSettings.Ports,
  Volumes: .[0].Mounts,
  Memory: .[0].HostConfig.Memory,
  RestartPolicy: .[0].HostConfig.RestartPolicy
}' > container_report.json
```

## 9. 总结

::: warning 排障顺序建议

1. `docker logs` 确认是否为业务级异常。
2. `docker inspect` 尤其是网络、挂载、资源字段，可快速定位配置问题。
3. 若配置正常，再通过 `docker exec` 进入容器继续排查。  
   :::

把这些模板保存进团队 Wiki 或脚本仓库，遇到 IP 冲突、DNS 失效、环境变量缺失、资源限制等问题时即可直接调用，大幅压缩定位时间。
