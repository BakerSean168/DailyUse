#!/bin/bash

# DailyUse 统一测试运行脚本
# 用法: ./test.sh [project] [pattern]
#
# 示例:
#   ./test.sh                    # 运行所有测试
#   ./test.sh api                # 运行 API 测试
#   ./test.sh api goal           # 运行 API 中包含 goal 的测试
#   ./test.sh web                # 运行 Web 测试
#   ./test.sh --help             # 显示帮助

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印彩色消息
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 显示帮助信息
show_help() {
    cat << 'HELP'
DailyUse 测试运行脚本

用法:
  ./test.sh [project] [pattern] [options]

参数:
  project     测试项目名称 (可选)
              - api              API 后端测试
              - web              Web 前端测试
              - domain-server    Domain Server 包测试
              - domain-client    Domain Client 包测试
              - all (默认)       运行所有测试
  
  pattern     测试文件匹配模式 (可选)
              - goal             匹配包含 "goal" 的测试
              - weight-snapshot  匹配特定测试文件
              - integration      匹配集成测试

选项:
  -h, --help     显示此帮助信息
  -d, --debug    启用调试模式
  -c, --coverage 生成覆盖率报告
  -w, --watch    监视模式 (文件变化时重新运行)

示例:
  ./test.sh                                # 运行所有测试
  ./test.sh api                            # 运行 API 所有测试
  ./test.sh api goal                       # 运行 API 中 goal 相关测试
  ./test.sh api weight-snapshot            # 运行特定测试文件
  ./test.sh api --coverage                 # 运行 API 测试并生成覆盖率
  ./test.sh web --watch                    # Web 测试监视模式
  ./test.sh domain-server                  # 运行 domain-server 测试

快捷命令:
  ./test.sh api integration                # 运行 API 集成测试
  ./test.sh api unit                       # 运行 API 单元测试
  ./test.sh web component                  # 运行 Web 组件测试

故障排查:
  1. 数据库连接失败
     → docker-compose -f docker-compose.test.yml up -d
  
  2. Prisma schema 不同步
     → cd apps/api && pnpm prisma db push
  
  3. 依赖未安装
     → pnpm install

文档:
  - 测试系统架构: packages/test-utils/docs/TEST_SYSTEM_ARCHITECTURE.md
  - API 测试指南: packages/test-utils/docs/API_TESTING_GUIDE.md
HELP
}

# 检查数据库连接
check_database() {
    print_info "检查测试数据库连接..."
    
    # 检查容器名称 (可能是 postgres-test 或 dailyuse-test-db)
    if ! docker ps | grep -qE '(postgres-test|dailyuse-test-db)'; then
        print_warning "测试数据库未运行"
        print_info "启动测试数据库容器..."
        docker-compose -f docker-compose.test.yml up -d 2>&1 | grep -v "the attribute"
        sleep 3
    fi
    
    # 再次检查
    if docker ps | grep -qE '(postgres-test|dailyuse-test-db)'; then
        print_success "测试数据库已就绪"
    else
        print_error "无法启动测试数据库"
        print_info "请手动检查: docker ps"
        exit 1
    fi
}

# 运行测试
run_tests() {
    local project=$1
    local pattern=$2
    local extra_args=$3
    
    print_info "运行测试: project=$project, pattern=$pattern"
    
    # 对于 API 测试,检查数据库
    if [[ "$project" == "api" ]] || [[ "$project" == "all" ]]; then
        check_database
    fi
    
    # 构建命令
    local cmd="pnpm nx test"
    
    if [[ "$project" != "all" ]]; then
        cmd="$cmd $project"
    fi
    
    if [[ -n "$pattern" ]]; then
        cmd="$cmd -- $pattern"
    fi
    
    if [[ -n "$extra_args" ]]; then
        cmd="$cmd $extra_args"
    fi
    
    print_info "执行命令: $cmd"
    echo ""
    
    # 执行测试
    eval $cmd
    
    local exit_code=$?
    
    echo ""
    if [[ $exit_code -eq 0 ]]; then
        print_success "测试通过!"
    else
        print_error "测试失败 (退出码: $exit_code)"
        exit $exit_code
    fi
}

# 主函数
main() {
    local project="all"
    local pattern=""
    local extra_args=""
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -d|--debug)
                export TEST_DEBUG=true
                print_info "调试模式已启用"
                shift
                ;;
            -c|--coverage)
                extra_args="$extra_args --coverage"
                print_info "将生成覆盖率报告"
                shift
                ;;
            -w|--watch)
                extra_args="$extra_args --watch"
                print_info "监视模式已启用"
                shift
                ;;
            api|web|desktop|domain-server|domain-client|contracts|ui|utils)
                project=$1
                shift
                ;;
            all)
                project="all"
                shift
                ;;
            *)
                if [[ -z "$pattern" ]]; then
                    pattern=$1
                else
                    extra_args="$extra_args $1"
                fi
                shift
                ;;
        esac
    done
    
    # 运行测试
    run_tests "$project" "$pattern" "$extra_args"
}

# 执行
main "$@"
