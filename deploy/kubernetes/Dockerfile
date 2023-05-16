FROM nginx:1.22

# 添加网站文件
COPY dist /var/www/hujinbo.me/public

# 添加配置文件
COPY deploy/kubernetes/nginx.conf /etc/nginx/nginx.conf

# 设置工作目录
WORKDIR /var/www/hujinbo.me/public

# 开放端口
EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
