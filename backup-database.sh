#!/bin/bash

# ============================================
# ParselMonitor - PostgreSQL Database Backup Script
# ============================================
# This script creates timestamped backups of the PostgreSQL database
# - Creates backups in ./backups/ directory
# - Keeps last 7 days of backups
# - Works with Docker containers
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="db_backup_${TIMESTAMP}.sql"
RETENTION_DAYS=7

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}ParselMonitor Database Backup${NC}"
echo -e "${GREEN}=====================================${NC}"

# Load environment variables
if [ -f .env ]; then
    echo -e "${YELLOW}Loading environment from .env${NC}"
    export $(cat .env | grep -v '^#' | xargs)
elif [ -f .env.production ]; then
    echo -e "${YELLOW}Loading environment from .env.production${NC}"
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo -e "${RED}Error: No .env or .env.production file found${NC}"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if Docker container is running
# Prioritize names used in project
CANDIDATE_CONTAINERS=("parselmonitor-db" "postgresql-postgres-1" "postgres")
CONTAINER_NAME=""

for name in "${CANDIDATE_CONTAINERS[@]}"; do
    if docker ps | grep -q "$name"; then
        CONTAINER_NAME=$(docker ps --format '{{.Names}}' | grep "$name" | head -1)
        break
    fi
done

if [ -z "$CONTAINER_NAME" ]; then
    echo -e "${RED}Error: PostgreSQL container not found or not running${NC}"
    echo -e "${YELLOW}Checked for: ${CANDIDATE_CONTAINERS[*]}${NC}"
    echo -e "${YELLOW}Available containers:${NC}"
    docker ps --format 'table {{.Names}}\t{{.Status}}'
    exit 1
fi

echo -e "${GREEN}Found PostgreSQL container: ${CONTAINER_NAME}${NC}"

# Get database credentials from environment
DB_USER=${DB_USER:-parselmonitor_user}
DB_NAME=${DB_NAME:-parselmonitor}

# Ensure DB_PASSWORD is set (loaded from .env)
# Only fail if not set - sometimes .pgpass is used, but for docker exec we usually need it
if [ -z "$DB_PASSWORD" ]; then
    echo -e "${YELLOW}Warning: DB_PASSWORD not found in environment. Assuming configured via .pgpass or trust auth.${NC}"
fi

echo -e "${YELLOW}Creating backup...${NC}"
echo -e "Database: ${DB_NAME}"
echo -e "User: ${DB_USER}"
echo -e "Backup file: ${BACKUP_DIR}/${BACKUP_FILE}"

# Create backup using pg_dump via Docker
# Capture stderr to a temporary file for debugging
ERROR_LOG=$(mktemp)

# Use explicit PGPASSWORD if available
if [ -n "$DB_PASSWORD" ]; then
    docker exec -e PGPASSWORD="$DB_PASSWORD" "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists > "${BACKUP_DIR}/${BACKUP_FILE}" 2> "$ERROR_LOG" || true
else
    docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists > "${BACKUP_DIR}/${BACKUP_FILE}" 2> "$ERROR_LOG" || true
fi

# Check exit code manually (to handle pipefail issues if we set it)
# We didn't set pipefail, so we check if the file has content and if ERROR_LOG has critical errors

# Check if backup file is empty
FILE_SIZE_BYTES=$(stat -f%z "${BACKUP_DIR}/${BACKUP_FILE}" 2>/dev/null || stat -c%s "${BACKUP_DIR}/${BACKUP_FILE}" 2>/dev/null)
if [ -z "$FILE_SIZE_BYTES" ]; then FILE_SIZE_BYTES=0; fi

if [ "$FILE_SIZE_BYTES" -gt 100 ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    echo -e "${GREEN}✓ Backup created successfully!${NC}"
    echo -e "  File: ${BACKUP_FILE}"
    echo -e "  Size: ${BACKUP_SIZE}"
    rm "$ERROR_LOG"
else
    echo -e "${RED}✗ Backup failed!${NC}"
    echo -e "${RED}Error details form pg_dump:${NC}"
    cat "$ERROR_LOG"
    rm "$ERROR_LOG"
    rm -f "${BACKUP_DIR}/${BACKUP_FILE}" # Remove failed/empty file
    exit 1
fi

# Clean up old backups (keep last 7 days)
echo -e "${YELLOW}Cleaning up old backups (keeping last ${RETENTION_DAYS} days)...${NC}"
find "$BACKUP_DIR" -name "db_backup_*.sql" -type f -mtime +$RETENTION_DAYS -delete

# List all remaining backups
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/db_backup_*.sql 2>/dev/null | wc -l)
if [ $BACKUP_COUNT -gt 0 ]; then
    echo -e "${GREEN}Current backups (${BACKUP_COUNT}):${NC}"
    ls -lh "$BACKUP_DIR"/db_backup_*.sql | awk '{print "  " $9 " (" $5 ")"}'
else
    echo -e "${YELLOW}No backups found${NC}"
fi

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}Backup completed successfully!${NC}"
echo -e "${GREEN}=====================================${NC}"

# Instructions for restore
echo -e "\n${YELLOW}To restore from this backup, run:${NC}"
echo -e "  cat ${BACKUP_DIR}/${BACKUP_FILE} | docker exec -i ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME}"
