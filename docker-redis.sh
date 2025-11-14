#!/bin/bash
# Redis Docker Management Script for Development

set -e

case "$1" in
  start)
    echo "🚀 Starting Redis container..."
    docker-compose up -d redis-dev
    echo "✅ Redis started successfully"
    echo "📊 Redis connection info:"
    echo "   Host: localhost"
    echo "   Port: 6384"
    echo "   Password: dailyuse123"
    echo "   DB: 0"
    ;;
  stop)
    echo "🛑 Stopping Redis container..."
    docker-compose stop redis-dev
    echo "✅ Redis stopped"
    ;;
  restart)
    echo "🔄 Restarting Redis container..."
    docker-compose restart redis-dev
    echo "✅ Redis restarted"
    ;;
  logs)
    echo "📜 Redis logs (Ctrl+C to exit):"
    docker-compose logs -f redis-dev
    ;;
  status)
    echo "📊 Redis status:"
    docker ps --filter "name=redis" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    ;;
  cli)
    echo "🔧 Connecting to Redis CLI..."
    docker exec -it dailyuse-dev-redis redis-cli -a dailyuse123
    ;;
  test)
    echo "🧪 Testing Redis connection..."
    if docker exec dailyuse-dev-redis redis-cli -a dailyuse123 ping > /dev/null 2>&1; then
      echo "✅ Redis is responding"
      echo "📊 Redis info:"
      docker exec dailyuse-dev-redis redis-cli -a dailyuse123 INFO server 2>/dev/null | grep -E "redis_version|uptime_in_seconds|connected_clients"
    else
      echo "❌ Redis is not responding"
      exit 1
    fi
    ;;
  clean)
    echo "🧹 Cleaning Redis data..."
    read -p "⚠️  This will delete all Redis data. Continue? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      docker-compose down redis-dev
      docker volume rm dailyuse-dev-redis-data 2>/dev/null || true
      echo "✅ Redis data cleaned"
    else
      echo "❌ Cancelled"
    fi
    ;;
  *)
    echo "Redis Docker Management Script"
    echo ""
    echo "Usage: $0 {start|stop|restart|logs|status|cli|test|clean}"
    echo ""
    echo "Commands:"
    echo "  start    - Start Redis container"
    echo "  stop     - Stop Redis container"
    echo "  restart  - Restart Redis container"
    echo "  logs     - Show Redis logs"
    echo "  status   - Show Redis container status"
    echo "  cli      - Connect to Redis CLI"
    echo "  test     - Test Redis connection"
    echo "  clean    - Remove Redis container and data"
    exit 1
    ;;
esac
