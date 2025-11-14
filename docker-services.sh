#!/bin/bash
# Docker Services Management Script
# 统一管理开发数据库、测试数据库、Redis

set -e

case "$1" in
  start)
    case "$2" in
      dev-db|postgres-dev)
        echo "🚀 Starting development database..."
        docker-compose up -d postgres-dev
        echo "✅ Development database started"
        echo "📊 Connection info:"
        echo "   Host: localhost"
        echo "   Port: 5432"
        echo "   Database: dailyuse"
        echo "   User: dailyuse"
        echo "   Password: dailyuse123"
        ;;
      test-db|postgres-test)
        echo "🚀 Starting test database..."
        docker-compose up -d postgres-test
        echo "✅ Test database started"
        echo "📊 Connection info:"
        echo "   Host: localhost"
        echo "   Port: 5433"
        echo "   Database: dailyuse_test"
        echo "   User: test_user"
        echo "   Password: test_pass"
        ;;
      redis)
        echo "🚀 Starting Redis..."
        docker-compose up -d redis-dev
        echo "✅ Redis started"
        echo "📊 Connection info:"
        echo "   Host: localhost"
        echo "   Port: 6384"
        echo "   Password: dailyuse123"
        echo "   DB: 0"
        ;;
      all|"")
        echo "🚀 Starting all services..."
        docker-compose up -d
        echo "✅ All services started"
        echo ""
        echo "📊 Services info:"
        echo ""
        echo "Development Database (PostgreSQL 16):"
        echo "   Host: localhost:5432"
        echo "   Database: dailyuse"
        echo "   User: dailyuse"
        echo "   Password: dailyuse123"
        echo ""
        echo "Test Database (PostgreSQL 15):"
        echo "   Host: localhost:5433"
        echo "   Database: dailyuse_test"
        echo "   User: test_user"
        echo "   Password: test_pass"
        echo ""
        echo "Redis:"
        echo "   Host: localhost:6384"
        echo "   Password: dailyuse123"
        echo "   DB: 0"
        ;;
      *)
        echo "❌ Unknown service: $2"
        echo "Available services: dev-db, test-db, redis, all"
        exit 1
        ;;
    esac
    ;;
    
  stop)
    case "$2" in
      dev-db|postgres-dev)
        echo "🛑 Stopping development database..."
        docker-compose stop postgres-dev
        echo "✅ Development database stopped"
        ;;
      test-db|postgres-test)
        echo "🛑 Stopping test database..."
        docker-compose stop postgres-test
        echo "✅ Test database stopped"
        ;;
      redis)
        echo "🛑 Stopping Redis..."
        docker-compose stop redis-dev
        echo "✅ Redis stopped"
        ;;
      all|"")
        echo "🛑 Stopping all services..."
        docker-compose stop
        echo "✅ All services stopped"
        ;;
      *)
        echo "❌ Unknown service: $2"
        echo "Available services: dev-db, test-db, redis, all"
        exit 1
        ;;
    esac
    ;;
    
  restart)
    case "$2" in
      dev-db|postgres-dev)
        echo "🔄 Restarting development database..."
        docker-compose restart postgres-dev
        echo "✅ Development database restarted"
        ;;
      test-db|postgres-test)
        echo "🔄 Restarting test database..."
        docker-compose restart postgres-test
        echo "✅ Test database restarted"
        ;;
      redis)
        echo "🔄 Restarting Redis..."
        docker-compose restart redis-dev
        echo "✅ Redis restarted"
        ;;
      all|"")
        echo "🔄 Restarting all services..."
        docker-compose restart
        echo "✅ All services restarted"
        ;;
      *)
        echo "❌ Unknown service: $2"
        echo "Available services: dev-db, test-db, redis, all"
        exit 1
        ;;
    esac
    ;;
    
  logs)
    case "$2" in
      dev-db|postgres-dev)
        echo "📜 Development database logs (Ctrl+C to exit):"
        docker-compose logs -f postgres-dev
        ;;
      test-db|postgres-test)
        echo "📜 Test database logs (Ctrl+C to exit):"
        docker-compose logs -f postgres-test
        ;;
      redis)
        echo "📜 Redis logs (Ctrl+C to exit):"
        docker-compose logs -f redis-dev
        ;;
      all|"")
        echo "📜 All services logs (Ctrl+C to exit):"
        docker-compose logs -f
        ;;
      *)
        echo "❌ Unknown service: $2"
        echo "Available services: dev-db, test-db, redis, all"
        exit 1
        ;;
    esac
    ;;
    
  status)
    echo "📊 Docker services status:"
    echo ""
    docker-compose ps
    echo ""
    docker ps --filter "name=dailyuse" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    ;;
    
  clean)
    case "$2" in
      dev-db|postgres-dev)
        echo "🧹 Cleaning development database..."
        read -p "⚠️  This will delete all development data. Continue? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
          docker-compose down postgres-dev
          docker volume rm dailyuse-dev-db-data 2>/dev/null || true
          echo "✅ Development database cleaned"
        else
          echo "❌ Cancelled"
        fi
        ;;
      test-db|postgres-test)
        echo "🧹 Cleaning test database..."
        docker-compose down postgres-test
        echo "✅ Test database cleaned (tmpfs data automatically cleared)"
        ;;
      redis)
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
      all)
        echo "🧹 Cleaning all services..."
        read -p "⚠️  This will delete ALL data (dev-db and redis). Continue? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
          docker-compose down
          docker volume rm dailyuse-dev-db-data 2>/dev/null || true
          docker volume rm dailyuse-dev-redis-data 2>/dev/null || true
          echo "✅ All services cleaned"
        else
          echo "❌ Cancelled"
        fi
        ;;
      *)
        echo "❌ Unknown service: $2"
        echo "Available services: dev-db, test-db, redis, all"
        exit 1
        ;;
    esac
    ;;
    
  redis-cli)
    echo "🔧 Connecting to Redis CLI..."
    docker exec -it dailyuse-dev-redis redis-cli -a dailyuse123
    ;;
    
  psql-dev)
    echo "🔧 Connecting to development database..."
    docker exec -it dailyuse-dev-db psql -U dailyuse -d dailyuse
    ;;
    
  psql-test)
    echo "🔧 Connecting to test database..."
    docker exec -it dailyuse-test-db psql -U test_user -d dailyuse_test
    ;;
    
  *)
    echo "Docker Services Management Script"
    echo ""
    echo "Usage: $0 {command} [service]"
    echo ""
    echo "Commands:"
    echo "  start [service]   - Start service(s)"
    echo "  stop [service]    - Stop service(s)"
    echo "  restart [service] - Restart service(s)"
    echo "  logs [service]    - Show logs"
    echo "  status            - Show all services status"
    echo "  clean [service]   - Remove service and data"
    echo "  redis-cli         - Connect to Redis CLI"
    echo "  psql-dev          - Connect to dev database"
    echo "  psql-test         - Connect to test database"
    echo ""
    echo "Services:"
    echo "  dev-db     - Development database (PostgreSQL 16, port 5432)"
    echo "  test-db    - Test database (PostgreSQL 15, port 5433)"
    echo "  redis      - Redis (port 6384)"
    echo "  all        - All services (default)"
    echo ""
    echo "Examples:"
    echo "  $0 start              # Start all services"
    echo "  $0 start dev-db       # Start only development database"
    echo "  $0 stop redis         # Stop only Redis"
    echo "  $0 logs dev-db        # Show dev database logs"
    echo "  $0 clean all          # Clean all data"
    exit 1
    ;;
esac
