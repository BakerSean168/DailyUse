#!/bin/bash
# Docker 测试数据库管理脚本

case "$1" in
  start)
    echo "🐳 启动测试数据库..."
    docker start dailyuse-test-db || docker run -d \
      --name dailyuse-test-db \
      -e POSTGRES_USER=test_user \
      -e POSTGRES_PASSWORD=test_pass \
      -e POSTGRES_DB=dailyuse_test \
      -p 5433:5432 \
      -v dailyuse-test-db-data:/var/lib/postgresql/data \
      postgres:15-alpine
    
    echo "✅ 测试数据库已启动"
    ;;
  
  stop)
    echo "🛑 停止测试数据库..."
    docker stop dailyuse-test-db
    echo "✅ 测试数据库已停止"
    ;;
  
  restart)
    echo "🔄 重启测试数据库..."
    docker restart dailyuse-test-db
    echo "✅ 测试数据库已重启"
    ;;
  
  status)
    echo "📊 测试数据库状态:"
    docker ps -a | grep dailyuse-test-db
    ;;
  
  logs)
    echo "📜 测试数据库日志:"
    docker logs -f dailyuse-test-db
    ;;
  
  reset)
    echo "⚠️  重置测试数据库（将删除所有数据）..."
    docker exec -i dailyuse-test-db psql -U test_user -c "DROP DATABASE IF EXISTS dailyuse_test;" -c "CREATE DATABASE dailyuse_test;"
    
    # 同步 schema
    echo "📦 同步数据库 schema..."
    cd apps/api && DATABASE_URL='postgresql://test_user:test_pass@localhost:5433/dailyuse_test' npx prisma db push --skip-generate
    echo "✅ 测试数据库已重置"
    ;;
  
  shell)
    echo "🐚 进入测试数据库 shell..."
    docker exec -it dailyuse-test-db psql -U test_user -d dailyuse_test
    ;;
  
  shell-user)
    echo "🐚 以 test_user 身份进入测试数据库 shell..."
    docker exec -it dailyuse-test-db psql -U test_user -d dailyuse_test
    ;;
  
  sync-schema)
    echo "📦 同步测试数据库 schema（不删除数据）..."
    cd apps/api && DATABASE_URL='postgresql://test_user:test_pass@localhost:5433/dailyuse_test' npx prisma db push --skip-generate
    echo "✅ Schema 已同步"
    ;;
  
  check-timeout)
    echo "🔍 检查 schedule_tasks 表的 timeout 字段定义..."
    docker exec dailyuse-test-db psql -U test_user -d dailyuse_test -c "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'schedule_tasks' AND column_name = 'timeout';"
    ;;
  
  fix-timeout)
    echo "🔧 修复 schedule_tasks 表的 timeout 字段（设置为 nullable 并清理旧数据）..."
    docker exec dailyuse-test-db psql -U test_user -d dailyuse_test -c "ALTER TABLE schedule_tasks ALTER COLUMN timeout DROP NOT NULL;" 2>/dev/null || true
    docker exec dailyuse-test-db psql -U test_user -d dailyuse_test -c "UPDATE schedule_tasks SET timeout = NULL WHERE timeout = 0;"
    echo "✅ timeout 字段已修复"
    ;;
  
  clean-data)
    echo "🧹 清理测试数据（保留 schema）..."
    docker exec dailyuse-test-db psql -U test_user -d dailyuse_test -c "
      DO \$\$ 
      DECLARE 
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations') 
        LOOP
          EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END \$\$;
    "
    echo "✅ 测试数据已清理"
    ;;
  
  remove)
    echo "🗑️  完全删除测试数据库容器和数据卷..."
    docker stop dailyuse-test-db 2>/dev/null || true
    docker rm dailyuse-test-db 2>/dev/null || true
    docker volume rm dailyuse-test-db-data 2>/dev/null || true
    echo "✅ 测试数据库已完全删除"
    ;;
  
  *)
    echo "用法: $0 {start|stop|restart|status|logs|reset|shell|shell-user|sync-schema|check-timeout|fix-timeout|clean-data|remove}"
    echo ""
    echo "命令说明:"
    echo "  start        - 启动测试数据库容器"
    echo "  stop         - 停止测试数据库容器"
    echo "  restart      - 重启测试数据库容器"
    echo "  status       - 查看数据库状态"
    echo "  logs         - 查看数据库日志"
    echo "  reset        - 重置数据库（删除所有数据并重新同步 schema）"
    echo "  shell        - 以 postgres 用户进入数据库 shell"
    echo "  shell-user   - 以 test_user 用户进入数据库 shell"
    echo "  sync-schema  - 同步 schema（不删除数据）"
    echo "  check-timeout - 检查 timeout 字段定义"
    echo "  fix-timeout  - 修复 timeout 字段（设置为 nullable）"
    echo "  clean-data   - 清理所有测试数据（保留 schema）"
    echo "  remove       - 完全删除容器和数据卷"
    exit 1
    ;;
esac
