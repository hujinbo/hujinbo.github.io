#!/bin/bash

# 进入部署目录
cd /home/data/blog/

# 拉取最新的Docker镜像
docker-compose pull

# 启动Docker容器
docker-compose up -d
