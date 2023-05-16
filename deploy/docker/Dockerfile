FROM nginx:1.22

# 添加网站文件
COPY dist /var/www/hujinbo.me/public

# 添加配置文件
COPY deploy/docker/nginx.conf /etc/nginx/nginx.conf

# 生成2048位的Diffie-Hellman密钥参数
RUN openssl dhparam -out /etc/nginx/dhparam.pem 2048

# 设置工作目录
WORKDIR /var/www/hujinbo.me/public

# 开放端口
EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
