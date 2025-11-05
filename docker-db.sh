#!/bin/bash
# Docker 开发数据库管理脚本

case "$1" in
  start)
    echo "🐳 启动 Docker 数据库..."
    docker start dailyuse-dev-db || docker run -d \
      --name dailyuse-dev-db \
      -e POSTGRES_USER=dailyuse \
      -e POSTGRES_PASSWORD=dailyuse123 \
      -e POSTGRES_DB=dailyuse \
      -p 5432:5432 \
      -v dailyuse-dev-db-data:/var/lib/postgresql/data \
      postgres:16-alpine
    echo "✅ Docker 数据库已启动"
    ;;
  
  stop)
    echo "🛑 停止 Docker 数据库..."
    docker stop dailyuse-dev-db
    echo "✅ Docker 数据库已停止"
    ;;
  
  restart)
    echo "🔄 重启 Docker 数据库..."
    docker restart dailyuse-dev-db
    echo "✅ Docker 数据库已重启"
    ;;
  
  status)
    echo "📊 Docker 数据库状态:"
    docker ps -a | grep dailyuse-dev-db
    ;;
  
  logs)
    echo "📜 Docker 数据库日志:"
    docker logs -f dailyuse-dev-db
    ;;
  
  reset)
    echo "⚠️  重置数据库（将删除所有数据）..."
    docker exec -i dailyuse-dev-db psql -U dailyuse postgres -c "DROP DATABASE IF EXISTS dailyuse;" -c "CREATE DATABASE dailyuse;"
    cd apps/api && npx prisma migrate deploy
    echo "✅ 数据库已重置"
    ;;
  
  shell)
    echo "🐚 进入数据库 shell..."
    docker exec -it dailyuse-dev-db psql -U dailyuse -d dailyuse
    ;;
  
  *)
    echo "用法: $0 {start|stop|restart|status|logs|reset|shell}"
    echo ""
    echo "命令说明:"
    echo "  start   - 启动 Docker 数据库"
    echo "  stop    - 停止 Docker 数据库"
    echo "  restart - 重启 Docker 数据库"
    echo "  status  - 查看数据库状态"
    echo "  logs    - 查看数据库日志"
    echo "  reset   - 重置数据库（删除所有数据并重新迁移）"
    echo "  shell   - 进入数据库 shell"
    exit 1
    ;;
esac
