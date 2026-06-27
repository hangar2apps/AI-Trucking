#!/bin/sh
set -e
cd "$(dirname "$0")/.."

echo "Building and starting Autonomous Freight on port 5173..."
docker compose -f docker-compose.nas.yml up -d --build

echo ""
echo "Health check:"
sleep 2
wget -qO- http://127.0.0.1:5173/ >/dev/null && echo "OK  http://127.0.0.1:5173" || echo "FAIL - container may still be starting"

echo ""
echo "Cloudflare tunnel service URL should be: localhost:5173"
echo "LAN URL: http://192.168.1.237:5173"
