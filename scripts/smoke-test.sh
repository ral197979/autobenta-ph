#!/bin/bash
# AutoBenta PH Smoke Test Script
# Runs basic API checks against a running server

BASE_URL="${API_URL:-http://localhost:3001}"
PASS=0
FAIL=0

check() {
  local label=$1
  local expected=$2
  local actual=$3
  if [[ "$actual" == *"$expected"* ]]; then
    echo "✅ $label"
    ((PASS++))
  else
    echo "❌ $label (expected: $expected, got: $actual)"
    ((FAIL++))
  fi
}

echo "🚗 AutoBenta PH Smoke Tests — $BASE_URL"
echo "======================================="

# Health check
HEALTH=$(curl -s "$BASE_URL/api/health")
check "Health endpoint returns ok" '"status":"ok"' "$HEALTH"
check "Health returns service name" '"service":"AutoBenta PH API"' "$HEALTH"

# Listings
LISTINGS=$(curl -s "$BASE_URL/api/listings")
check "Listings returns array" '"listings"' "$LISTINGS"
check "Listings has pagination" '"pagination"' "$LISTINGS"

# Filters
FILTERED=$(curl -s "$BASE_URL/api/listings?make=Toyota")
check "Filter by make works" '"listings"' "$FILTERED"

PRICE_FILTERED=$(curl -s "$BASE_URL/api/listings?priceMin=500000&priceMax=1500000")
check "Filter by price range works" '"listings"' "$PRICE_FILTERED"

# Auth - invalid login
AUTH_FAIL=$(curl -s -X POST "$BASE_URL/api/auth/login" -H "Content-Type: application/json" -d '{"email":"fake@test.com","password":"wrong"}')
check "Invalid login returns error" '"error"' "$AUTH_FAIL"

# Financing calculator
CALC=$(curl -s -X POST "$BASE_URL/api/financing/calculate" -H "Content-Type: application/json" -d '{"vehiclePrice":800000,"downPayment":160000,"termMonths":60,"incomeRange":"50k_100k"}')
check "Financing calculator returns monthly" '"estimatedMonthly"' "$CALC"
check "Financing calculator returns loan amount" '"loanAmount"' "$CALC"

# Protected route without auth
ME=$(curl -s "$BASE_URL/api/auth/me")
check "Protected route requires auth" '"error"' "$ME"

# Admin without auth
ADMIN=$(curl -s "$BASE_URL/api/admin/stats")
check "Admin requires auth" '"error"' "$ADMIN"

echo ""
echo "======================================="
echo "Results: $PASS passed, $FAIL failed"
if [ $FAIL -gt 0 ]; then exit 1; fi
