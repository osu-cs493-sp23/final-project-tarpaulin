#!/bin/bash
# Run as a super user if permission is denied
# or make the file executable

# docker-compose down -v
# docker-compose up -d mysql
# docker-compose build
# docker-compose up

docker run -d --name tarpaulin  -p "3306:3306" -e "MYSQL_ROOT_PASSWORD=squid" -e "MYSQL_DATABASE=tarpaulin" -e "MYSQL_USER=squid" -e "MYSQL_PASSWORD=squid" mysql:latest
docker run -d --name redis-server  -p 6379:6379  redis:latest
npm run dev
