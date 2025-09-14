#!/bin/bash

# Document Repository Startup Script
# This script provides multiple ways to start the application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Document Repository Startup Script${NC}"
echo

# Function to check if Docker is available
check_docker() {
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to check if .env exists
check_env() {
    if [ -f ".env" ]; then
        return 0
    else
        return 1
    fi
}

# Function to start with Docker
start_docker() {
    echo -e "${BLUE}Starting with Docker...${NC}"
    
    if ! check_env; then
        echo -e "${YELLOW}Creating .env file from example...${NC}"
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env file${NC}"
        echo -e "${YELLOW}⚠️  Please edit .env file with your configuration before running again${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}Building and starting containers...${NC}"
    make dev-up
    
    echo
    echo -e "${GREEN}✅ Application started successfully!${NC}"
    echo -e "${BLUE}📱 Frontend: http://localhost:3000${NC}"
    echo -e "${BLUE}🔧 Backend API: http://localhost:8088${NC}"
    echo -e "${BLUE}📚 API Docs: http://localhost:8088/docs${NC}"
    echo
    echo -e "${YELLOW}To stop the application, run: make dev-down${NC}"
}

# Function to start manually
start_manual() {
    echo -e "${BLUE}Starting manually...${NC}"
    
    # Check prerequisites
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python 3 is not installed${NC}"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
    
    # Check if backend dependencies are installed
    if [ ! -f "backend/venv/bin/activate" ] && [ ! -f "backend/.venv/bin/activate" ]; then
        echo -e "${YELLOW}Setting up Python virtual environment...${NC}"
        cd backend
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
        cd ..
        echo -e "${GREEN}✅ Backend dependencies installed${NC}"
    fi
    
    # Check if frontend dependencies are installed
    if [ ! -d "frontend/node_modules" ]; then
        echo -e "${YELLOW}Installing frontend dependencies...${NC}"
        cd frontend
        npm install
        cd ..
        echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
    fi
    
    # Start services
    echo -e "${BLUE}Starting backend...${NC}"
    cd backend
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
    elif [ -f ".venv/bin/activate" ]; then
        source .venv/bin/activate
    fi
    python main_production_fast.py &
    BACKEND_PID=$!
    cd ..
    
    sleep 3
    
    echo -e "${BLUE}Starting frontend...${NC}"
    cd frontend
    npm start &
    FRONTEND_PID=$!
    cd ..
    
    echo
    echo -e "${GREEN}✅ Application started successfully!${NC}"
    echo -e "${BLUE}📱 Frontend: http://localhost:3000${NC}"
    echo -e "${BLUE}🔧 Backend API: http://localhost:8088${NC}"
    echo -e "${BLUE}📚 API Docs: http://localhost:8088/docs${NC}"
    echo
    echo -e "${YELLOW}Backend PID: $BACKEND_PID${NC}"
    echo -e "${YELLOW}Frontend PID: $FRONTEND_PID${NC}"
    echo -e "${YELLOW}To stop: kill $BACKEND_PID $FRONTEND_PID${NC}"
    
    # Wait for user input to stop
    echo
    echo -e "${YELLOW}Press Ctrl+C to stop all services...${NC}"
    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
    wait
}

# Main menu
echo -e "${YELLOW}Choose startup method:${NC}"
echo "1) Docker (Recommended)"
echo "2) Manual setup"
echo "3) Exit"
echo

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        if check_docker; then
            start_docker
        else
            echo -e "${RED}❌ Docker or Docker Compose is not installed${NC}"
            echo -e "${YELLOW}Please install Docker and Docker Compose first${NC}"
            echo -e "${BLUE}Visit: https://docs.docker.com/get-docker/${NC}"
            exit 1
        fi
        ;;
    2)
        start_manual
        ;;
    3)
        echo -e "${BLUE}Goodbye!${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac
