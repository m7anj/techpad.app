#!/bin/bash

# Start both backend and frontend dev servers concurrently

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting development servers...${NC}"

# Function to cleanup background processes on exit
cleanup() {
    echo -e "\n${GREEN}Shutting down servers...${NC}"
    kill $(jobs -p) 2>/dev/null
    exit
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Start backend server in background
echo -e "${BLUE}Starting backend server...${NC}"
cd backend && npm run dev &
BACKEND_PID=$!

# Start frontend server in background
echo -e "${BLUE}Starting frontend server..${NC}"
cd frontend && npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait
