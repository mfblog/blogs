---
title: "↔️ 内网穿透终解(一)"
outline: deep
desc: "本文将介绍阿里云Alpine镜像配合Frp搭配caddy"
tags: "阿里云/Frp/Caddy"
updateTime: "2024-12-12 13:06:32"
---

## 阿里云Alpine镜像配合Frp搭配caddy(一)

::: info 简介

阿里云在2023年更新了CDT计费规则，统一了云产品流量计费，并提供每月 **20G**（中国大陆/境外）和 **180G**（仅境外）的免费流量。在CDT免费流量框架下，我们可以使用按量计费的ECS，享受高带宽带来的极速体验。

:::

## ECS创建与购买

::: tip 上传与导入镜像

1. **上传镜像文件**  
   将 `.vhd` 文件上传至对应地域的 OSS（OSS桶可保持私有状态）。

2. **复制镜像 URL**  
   点击镜像文件详情，复制其中的 URL。

3. **导入镜像**  
   前往 ECS 的镜像页面，选择对应地域后点击“导入镜像”。

:::

[**Alpine下载地址**](https://wwsb.lanzoul.com/iDFCw2hwjt8d)

::: warning 镜像说明

- **版本**：基于 **3.20.2** 版本镜像  
- **磁盘空间**：根目录下可用空间 **823.5M**  
- **开箱即用**：未预装任何第三方组件  
- **SSH信息**：端口 `22` | 用户名 `root` | 密码 `luminous`  

请务必在首次开机后立即修改密码，避免被他人盗用。

:::

## 镜像展示

![update-alpine.png](/update-alpine.png)
![daoru-images.png](/daoru-images.png)
![image1.png](/image1.png)
![image2.png](/image2.png)
![server1.png](/server1.png)
![server2.png](/server2.png)
![server3.png](/server3.png)
