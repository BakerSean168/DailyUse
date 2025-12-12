#!/bin/bash

# DailyUse 部署脚本
# 用于快速部署应用到生产环境

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数定义
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# 检查前提条件
check_requirements() {
    print_header "检查前提条件"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装"
        exit 1
    fi
    print_success "Docker 已安装"
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安装"
        exit 1
    fi
    print_success "Docker Compose 已安装"
    
    if [ ! -f ".env" ]; then
        print_warning ".env 文件不存在，正在复制 .env.example..."
        cp .env.example .env
        print_warning "请编辑 .env 文件并修改关键配置（如密码）"
        exit 0
    fi
    print_success ".env 文件已存在"
}

# 检查空间
check_disk_space() {
    print_header "检查磁盘空间"
    
    available=$(df . | awk 'NR==2 {print $4}')
    required=2097152  # 2GB in KB
    
    if [ "$available" -lt "$required" ]; then
        print_error "磁盘空间不足（需要 2GB，可用 $(( available / 1024 / 1024 ))GB）"
        exit 1
    fi
    print_success "磁盘空间充足（$(( available / 1024 / 1024 ))GB）"
}

# 选择部署环境
choose_environment() {
    print_header "选择部署环境"
    
    echo "1) 开发环境 (docker-compose.yml)"
    echo "2) 生产环境 (docker-compose.prod.yml)"
    read -p "请选择 [1-2]: " choice
    
    case $choice in
        1)
            COMPOSE_FILE="docker-compose.yml"
            ENVIRONMENT="开发"
            ;;
        2)
            COMPOSE_FILE="docker-compose.prod.yml"
            ENVIRONMENT="生产"
            ;;
        *)
            print_error "无效选择"
            exit 1
            ;;
    esac
    
    print_success "已选择 $ENVIRONMENT 环境"
}

# 构建镜像
build_images() {
    print_header "构建 Docker 镜像"
    
    print_warning "构建镜像中，这可能需要几分钟..."
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    
    print_success "镜像构建完成"
}

# 启动服务
start_services() {
    print_header "启动服务"
    
    docker-compose -f "$COMPOSE_FILE" up -d
    
    print_success "服务已启动"
}

# 数据库迁移
run_migrations() {
    print_header "运行数据库迁移"
    
    print_warning "等待 API 容器启动..."
    sleep 5
    
    docker-compose -f "$COMPOSE_FILE" exec -T api pnpm prisma:migrate:deploy
    
    print_success "数据库迁移完成"
}

# 健康检查
health_check() {
    print_header "健康检查"
    
    echo "等待服务就绪..."
    for i in {1..30}; do
        if curl -s http://localhost:3000/health > /dev/null; then
            print_success "API 服务健康"
            break
        fi
        echo -n "."
        sleep 1
    done
    
    if curl -s http://localhost:3000/health > /dev/null; then
        print_success "API 检查通过"
    else
        print_warning "API 健康检查失败，请检查日志"
    fi
    
    echo ""
    sleep 2
    
    if curl -s http://localhost/ > /dev/null; then
        print_success "Web 服务健康"
    else
        print_warning "Web 健康检查失败"
    fi
}

# 显示访问信息
show_access_info() {
    print_header "部署完成！"
    
    echo -e "环境: ${BLUE}$ENVIRONMENT${NC}"
    echo -e "API 地址: ${GREEN}http://localhost:3000${NC}"
    echo -e "Web 地址: ${GREEN}http://localhost${NC}"
    echo ""
    echo "常用命令:"
    echo "  查看日志:          docker-compose -f $COMPOSE_FILE logs -f api"
    echo "  停止服务:          docker-compose -f $COMPOSE_FILE down"
    echo "  重启服务:          docker-compose -f $COMPOSE_FILE restart"
    echo "  查看容器状态:      docker-compose -f $COMPOSE_FILE ps"
}

# 错误处理
trap 'print_error "部署失败"; exit 1' ERR

# 主函数
main() {
    print_header "DailyUse 部署脚本"
    echo "版本: 0.1.0"
    echo ""
    
    check_requirements
    check_disk_space
    choose_environment
    
    read -p "确认开始部署？(y/n): " confirm
    if [ "$confirm" != "y" ]; then
        print_warning "部署已取消"
        exit 0
    fi
    
    build_images
    start_services
    health_check
    
    # 可选的数据库迁移
    read -p "运行数据库迁移？(y/n): " migrate
    if [ "$migrate" = "y" ]; then
        run_migrations
    fi
    
    show_access_info
}

# 运行主函数
main
