---
title: "📄 Alpine 笔记"
outline: deep
desc: "本文将介绍Alpine常用命令以及Alpine下Docker安装"
tags: "Alpine/Docker"
updateTime: "2024-12-19 08:06:32"
---

## 安装常用软件
```bash
apk add openssh vim bash util-linux bash bash-doc bash-completion curl net-tools
```
## Alpine相关命令
```bash
启动服务
rc-service 服务名称 start

重启服务
rc-service 服务名称 restart

查看服务状态
rc-service 服务名称 status
```

## Alpine安装SSH服务,并开启root登录
```bash

apk update

apk add openssh-server

rc-service sshd start

设置开机启动
rc-update add sshd

删除开机启动服务
rc-update del sshd

开放Root登录
echo 'PermitRootLogin yes' >> /etc/ssh/sshd_config

重启服务
rc-service sshd restart

显示所有服务
rc-status -a
```
## Alpine安装docker && docker-compose
### 安装docker

```bash
vim /etc/apk/repositories
```
### 去除 `community` 这一行的注释
```bash
http://mirrors.tuna.tsinghua.edu.cn/alpine/v3.21/community
```
### 更新包索引
```bash
apk update
```
### 安装docker
```bash
apk add docker
```

### docker添加到开机自启动
```bash
rc-update add docker boot
```
### 启动docker服务
```bash
service docker start
```
### 验证安装
```bash
docker --version
```
## 安装docker-compose
### 下载 Docker Compose
```bash
curl -L 'https://github.com/docker/compose/releases/download/v2.32.0/docker-compose-linux-x86_64' -o /usr/local/bin/docker-compose
```
### 赋予 Docker Compose 执行权限
```bash
chmod +x /usr/local/bin/docker-compose
```
### 验证安装
```bash
docker-compose --version
```