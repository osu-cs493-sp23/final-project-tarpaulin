#!/bin/bash
# Run as a super user if permission is denied
# or make the file executable

docker-compose down -v

docker-compose up -d mysql

docker-compose build
docker-compose up