#!/bin/bash
# Run as a super user if permission is denied
# or make the file executable
# $ chmod +x

exe docker-compose down -v

exe docker-compose up -d mysql

exe docker-compose build
exe docker-compose up