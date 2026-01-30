#!/bin/bash

# Backend Connection Test Script
# This script helps diagnose connection issues with the backend server

echo "========================================"
echo "Backend Connection Test"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if port 8084 is in use
echo -e "${YELLOW}Test 1: Checking if backend server is running on port 8084...${NC}"
if lsof -i :8084 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Port 8084 is in use - Backend server appears to be running${NC}"
    echo "Process details:"
    lsof -i :8084
else
    echo -e "${RED}✗ Port 8084 is not in use - Backend server is NOT running${NC}"
    echo -e "${YELLOW}Solution: Start your backend server on port 8084${NC}"
fi

echo ""
echo "========================================"

# Test 2: Test HTTP connection to backend
echo -e "${YELLOW}Test 2: Testing HTTP connection to backend...${NC}"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8084 2>/dev/null | grep -E "200|404|401|403" > /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8084 2>/dev/null)
    echo -e "${GREEN}✓ Backend server is responding (HTTP $HTTP_CODE)${NC}"
else
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8084 2>/dev/null)
    if [ "$HTTP_CODE" = "000" ]; then
        echo -e "${RED}✗ Cannot connect to backend server${NC}"
        echo -e "${YELLOW}Solution: Make sure the backend server is running${NC}"
    else
        echo -e "${YELLOW}⚠ Backend responded with HTTP $HTTP_CODE${NC}"
    fi
fi

echo ""
echo "========================================"

# Test 3: Test partneredhotel endpoint
echo -e "${YELLOW}Test 3: Testing /partneredhotel endpoint...${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:8084/partneredhotel 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "000" ]; then
    echo -e "${RED}✗ Cannot connect to /partneredhotel endpoint${NC}"
elif [ "$HTTP_CODE" = "401" ]; then
    echo -e "${YELLOW}⚠ Endpoint requires authentication (HTTP 401)${NC}"
    echo -e "${GREEN}This is expected - endpoint exists but needs a token${NC}"
elif [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Endpoint is accessible (HTTP 200)${NC}"
else
    echo -e "${YELLOW}⚠ Endpoint responded with HTTP $HTTP_CODE${NC}"
    echo "Response: $BODY"
fi

echo ""
echo "========================================"

# Test 4: Check Vite dev server
echo -e "${YELLOW}Test 4: Checking if Vite dev server is running on port 5177...${NC}"
if lsof -i :5177 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Vite dev server is running on port 5177${NC}"
else
    echo -e "${RED}✗ Vite dev server is NOT running on port 5177${NC}"
    echo -e "${YELLOW}Solution: Run 'npm run dev' to start the frontend${NC}"
fi

echo ""
echo "========================================"
echo "Summary"
echo "========================================"
echo ""
echo "Common issues and solutions:"
echo ""
echo "1. If backend server is not running:"
echo "   - Navigate to your backend project directory"
echo "   - Start the backend server (e.g., 'npm start', 'java -jar app.jar', './gradlew bootRun')"
echo ""
echo "2. If you see 500 errors:"
echo "   - Check backend server logs for detailed error messages"
echo "   - Verify database connection in backend"
echo "   - Check if the hotel ID exists in the database"
echo "   - Verify authentication token is valid"
echo ""
echo "3. If authentication fails (401/403):"
echo "   - Check if the token in localStorage is valid"
echo "   - Verify the token hasn't expired"
echo "   - Check if the user has permission to create rooms"
echo ""
echo "For more details, see: TROUBLESHOOTING_500_ERROR.md"
echo ""
