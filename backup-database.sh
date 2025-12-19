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
CONTAINER_NAME="parselmonitor-db"
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    # Try alternative container name (might be from docker-compose)
    # Filter for postgres containers
    CONTAINER_NAME=$(docker ps --format '{{.Names}}' | grep -i postgres | head -1)
    
    if [ -z "$CONTAINER_NAME" ]; then
        echo -e "${RED}Error: PostgreSQL container not found or not running${NC}"
        echo -e "${YELLOW}Available containers:${NC}"
        docker ps --format 'table {{.Names}}\t{{.Status}}'
        exit 1
    fi
fi

echo -e "${GREEN}Found PostgreSQL container: ${CONTAINER_NAME}${NC}"

# Get database credentials from environment
DB_USER=${DB_USER:-parselmonitor_user}
DB_NAME=${DB_NAME:-parselmonitor}
# Ensure DB_PASSWORD is set (loaded from .env)
if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}Error: DB_PASSWORD not found in environment${NC}"
    exit 1
fi

echo -e "${YELLOW}Creating backup...${NC}"
echo -e "Database: ${DB_NAME}"
echo -e "User: ${DB_USER}"
echo -e "Backup file: ${BACKUP_DIR}/${BACKUP_FILE}"

# Create backup using pg_dump via Docker
# IMPORTANT: 
# 1. Do NOT use -t (tty) for stdout redirection, it messes up line endings
# 2. Pass PGPASSWORD environment variable to docker exec
docker exec -e PGPASSWORD="$DB_PASSWORD" "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists > "${BACKUP_DIR}/${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    # Get file size
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    # Check if empty (sometimes grep failure or other issues create empty file)
    FILE_SIZE_BYTES=$(stat -f%z "${BACKUP_DIR}/${BACKUP_FILE}" 2>/dev/null || stat -c%s "${BACKUP_DIR}/${BACKUP_FILE}" 2>/dev/null)
    if [ "$FILE_SIZE_BYTES" -lt 100 ]; then
         echo -e "${RED}Warning: Backup file is very small ($FILE_SIZE_BYTES bytes). Check content/errors.${NC}"
    fi

    echo -e "${GREEN}✓ Backup created successfully!${NC}"
    echo -e "  File: ${BACKUP_FILE}"
    echo -e "  Size: ${BACKUP_SIZE}"
else
    echo -e "${RED}✗ Backup failed!${NC}"
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
