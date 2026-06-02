#!/bin/bash
set -e

echo "================================================================="
echo "  Manufacturing West Demo Portal - Teardown"
echo "  Safely removes the demo without breaking other SPCS apps"
echo "================================================================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}Connection Setup${NC}"
echo "Available connections:"
snow connection list 2>/dev/null || true
echo ""
read -p "Enter connection name to use: " CONNECTION_NAME
echo ""

echo "Testing connection..."
snow sql --connection "$CONNECTION_NAME" -q "SELECT CURRENT_USER()" >/dev/null 2>&1 || {
    echo -e "${RED}Connection test failed. Check your connection config.${NC}"
    exit 1
}
echo -e "${GREEN}Connection OK${NC}"
echo ""

snow_sql() {
    snow sql --connection "$CONNECTION_NAME" "$@" 2>/dev/null || true
}

read -p "Database name [DEMO_PORTAL]: " DATABASE
DATABASE=${DATABASE:-DEMO_PORTAL}
read -p "Schema name [PUBLIC]: " SCHEMA
SCHEMA=${SCHEMA:-PUBLIC}
read -p "Compute Pool name [DEMO_PORTAL_POOL]: " COMPUTE_POOL
COMPUTE_POOL=${COMPUTE_POOL:-DEMO_PORTAL_POOL}
read -p "Warehouse name [DEMO_PORTAL_WH]: " WAREHOUSE
WAREHOUSE=${WAREHOUSE:-DEMO_PORTAL_WH}
echo ""

echo -e "${YELLOW}This will remove:${NC}"
echo "  - Service: ${DATABASE}.${SCHEMA}.DEMO_PORTAL_SVC"
echo "  - External Access Integration: DEMO_PORTAL_EXTERNAL_ACCESS"
echo "  - Compute Pool: ${COMPUTE_POOL}"
echo "  - Warehouse: ${WAREHOUSE}"
echo "  - Database: ${DATABASE} (including all tables, stages, secrets)"
echo "  - Role: DEMO_PORTAL_ROLE"
echo "  - User: DEMO_PORTAL_SVC"
echo ""
echo -e "${GREEN}This will NOT remove:${NC}"
echo "  - RSA keys on your admin user"
echo "  - User-level network policies"
echo "  - Account-level network policy entries"
echo ""

read -p "Continue with teardown? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Teardown cancelled."
    exit 0
fi

echo ""
echo -e "${BOLD}Dropping service...${NC}"
snow_sql -q "ALTER SERVICE IF EXISTS ${DATABASE}.${SCHEMA}.DEMO_PORTAL_SVC SUSPEND;"
sleep 5
snow_sql -q "DROP SERVICE IF EXISTS ${DATABASE}.${SCHEMA}.DEMO_PORTAL_SVC;"
echo -e "${GREEN}✓ Service dropped${NC}"

echo -e "${BOLD}Dropping external access integration...${NC}"
snow_sql -q "DROP EXTERNAL ACCESS INTEGRATION IF EXISTS DEMO_PORTAL_EXTERNAL_ACCESS;"
echo -e "${GREEN}✓ EAI dropped${NC}"

echo -e "${BOLD}Dropping compute pool...${NC}"
snow_sql -q "ALTER COMPUTE POOL IF EXISTS ${COMPUTE_POOL} STOP ALL;"
sleep 5
snow_sql -q "DROP COMPUTE POOL IF EXISTS ${COMPUTE_POOL};"
echo -e "${GREEN}✓ Compute pool dropped${NC}"

echo -e "${BOLD}Dropping database ${DATABASE}...${NC}"
snow_sql -q "DROP DATABASE IF EXISTS ${DATABASE};"
echo -e "${GREEN}✓ Database dropped${NC}"

echo -e "${BOLD}Dropping warehouse...${NC}"
snow_sql -q "DROP WAREHOUSE IF EXISTS ${WAREHOUSE};"
echo -e "${GREEN}✓ Warehouse dropped${NC}"

echo -e "${BOLD}Dropping role and service user...${NC}"
snow_sql -q "DROP USER IF EXISTS DEMO_PORTAL_SVC;"
snow_sql -q "DROP ROLE IF EXISTS DEMO_PORTAL_ROLE;"
echo -e "${GREEN}✓ Role and user dropped${NC}"

echo ""
echo -e "${GREEN}=================================================================${NC}"
echo -e "${GREEN}  Teardown Complete${NC}"
echo -e "${GREEN}=================================================================${NC}"
echo ""
echo "  All Demo Portal objects have been removed."
echo "  To reinstall: ./setup.sh"
echo -e "${GREEN}=================================================================${NC}"
