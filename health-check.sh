#!/bin/bash

# Health Check Script for Document Repository

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🏥 Document Repository Health Check${NC}"
echo

# Function to check HTTP endpoint
check_endpoint() {
    local url=$1
    local name=$2
    local timeout=${3:-10}
    
    if curl -sf --max-time $timeout "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $name is healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ $name is not responding${NC}"
        return 1
    fi
}

# Function to check Docker services
check_docker_services() {
    echo -e "${BLUE}🐳 Checking Docker services...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}⚠️  Docker not found, skipping Docker checks${NC}"
        return 1
    fi
    
    local services=("docrepo_postgres_dev" "docrepo_backend_dev" "docrepo_frontend_dev")
    local all_healthy=true
    
    for service in "${services[@]}"; do
        if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$service.*Up"; then
            echo -e "${GREEN}✅ $service is running${NC}"
        else
            echo -e "${RED}❌ $service is not running${NC}"
            all_healthy=false
        fi
    done
    
    return $all_healthy
}

# Function to check database connection
check_database() {
    echo -e "${BLUE}🗄️  Checking database connection...${NC}"
    
    if command -v docker &> /dev/null && docker ps | grep -q "docrepo_postgres"; then
        # Check via Docker
        if docker exec docrepo_postgres_dev pg_isready -U docrepo_user -d document_repository > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Database is accessible${NC}"
            return 0
        else
            echo -e "${RED}❌ Database is not accessible${NC}"
            return 1
        fi
    else
        # Check direct connection
        if command -v pg_isready &> /dev/null; then
            if pg_isready -h localhost -p 5432 -U postgres > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Database is accessible${NC}"
                return 0
            else
                echo -e "${RED}❌ Database is not accessible${NC}"
                return 1
            fi
        else
            echo -e "${YELLOW}⚠️  pg_isready not found, skipping database check${NC}"
            return 1
        fi
    fi
}

# Main health checks
echo -e "${BLUE}🔍 Running health checks...${NC}"
echo

# Check services
check_docker_services
docker_status=$?

echo

# Check endpoints
check_endpoint "http://localhost:8088/" "Backend API"
backend_status=$?

check_endpoint "http://localhost:3000/" "Frontend"
frontend_status=$?

echo

# Check database
check_database
db_status=$?

echo

# Summary
echo -e "${BLUE}📊 Health Check Summary${NC}"
echo "========================"

if [ $backend_status -eq 0 ]; then
    echo -e "Backend API: ${GREEN}✅ Healthy${NC}"
else
    echo -e "Backend API: ${RED}❌ Unhealthy${NC}"
fi

if [ $frontend_status -eq 0 ]; then
    echo -e "Frontend: ${GREEN}✅ Healthy${NC}"
else
    echo -e "Frontend: ${RED}❌ Unhealthy${NC}"
fi

if [ $db_status -eq 0 ]; then
    echo -e "Database: ${GREEN}✅ Healthy${NC}"
else
    echo -e "Database: ${RED}❌ Unhealthy${NC}"
fi

echo

# Overall status
if [ $backend_status -eq 0 ] && [ $frontend_status -eq 0 ] && [ $db_status -eq 0 ]; then
    echo -e "${GREEN}🎉 All services are healthy!${NC}"
    echo -e "${BLUE}📱 Frontend: http://localhost:3000${NC}"
    echo -e "${BLUE}🔧 Backend API: http://localhost:8088${NC}"
    echo -e "${BLUE}📚 API Docs: http://localhost:8088/docs${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some services are not healthy${NC}"
    echo -e "${YELLOW}💡 Try running the startup script: ./start-interactive.sh${NC}"
    exit 1
fi
