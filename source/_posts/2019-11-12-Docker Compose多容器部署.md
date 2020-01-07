---
title: Docker Compose多容器部署
tags: Docker
categories: Docker
comments: true
mathjax: false
abbrlink: 53410
date: 2019-11-12 20:12:35
updated: 2019-11-12 20:12:35
description:
---
> Docker Compose是用于定义和运行多容器Docker应用程序的工具，可以通过YAML文件创建、管理多个容器。


## 安装

1. 下载Docker Compose可执行文件
```bash
sudo curl -L "https://github.com/docker/compose/releases/download/1.24.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
```

2. 修改可执行权限
```bash
sudo chmod +x /usr/local/bin/docker-compose
```

<!-- more -->

## 语法介绍

一个Services代表一个container，可以从image创建，也可以通过build创建，可以指定volume和network。如下通过docker部署wordpress应用：

```bash
# 创建数据卷
docker volume create mysql-data

# 创建网络
docker network create -d bridge my-net

# 运行容器
docker run -d --name wordpress --network my-net -p 8080:80 -e WORDPRESS_DB_HOST=mysql -e WORDPRESS_DB_PASSWORD=root wordpress
docker run -d --name mysql --network my-net -v mysql-data:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=wordpress mysql:5.7
```

通过Docker Compose部署则只需编写如下文件，执行`docker-compose up`命令即可：

```bash docker-compose.yml
version: '3'

services:
  wordpress:
    image: wordpress
    ports:
      - 8080:80
    environment:
      WORDPRESS_DB_HOST: mysql
      WORDPRESS_DB_PASSWORD: root
    networks:
      - my-net

  mysql:
    image: mysql:5.7
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: wordpress
    volumes:
      - mysql-data:/var/lib/mysql
    networks:
      - my-net

volumes:
  mysql-data:

networks:
  my-net:
    driver: bridge
```


## 常用命令

### 查看版本

```bash
docker-compose -v
```

### 构建容器

```bash
docker-compose build
```

### 启动服务

```bash
# 默认使用当前目录下的docker-compose.yml
docker-compose up

# 在后台运行，不打印日志
docker-compose up -d

# 根据指定文件启动
docker-compose -f docker-compose.yml up
```

### 查看镜像

```bash
docker-compose images
```

### 查看容器

```bash
docker-compose ps
```

### 进入容器

```bash
docker-compose exec mysql bash
```

### 停止服务

```bash
# 停止但不删除容器
docker-compose stop

# 停止容器并移除网络
docker-compose down
```

### 水平扩展

```bash
# 指定服务运行的容器个数，格式：service=num
docker-compose up -d --scale wordpress=3
```


{% note warning %}
更多内容，请阅读**[官方文档](https://docs.docker.com/compose/)**
{% endnote %}
