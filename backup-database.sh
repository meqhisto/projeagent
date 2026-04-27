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
DB_NAME=${DB_NAME:-parselmonitor}

# Function to attempt backup
perform_backup() {
    local USER=$1
    local PASSWORD=$2
    local OUT_FILE=$3
    local LOG_FILE=$4
    
    echo -e "${YELLOW}Attempting backup with user: ${USER}${NC}"
    
    # We use '|| return 1' to ensure non-zero return code if docker command fails
    if [ -n "$PASSWORD" ]; then
        docker exec -e PGPASSWORD="$PASSWORD" "$CONTAINER_NAME" pg_dump -U "$USER" -d "$DB_NAME" --clean --if-exists > "$OUT_FILE" 2> "$LOG_FILE" || return 1
    else
        docker exec "$CONTAINER_NAME" pg_dump -U "$USER" -d "$DB_NAME" --clean --if-exists > "$OUT_FILE" 2> "$LOG_FILE" || return 1
    fi
    
    return 0
}

# Try with configured user first
TARGET_USER=${DB_USER:-parselmonitor_user}
ERROR_LOG=$(mktemp)
SUCCESS=1

# Try primary user
# WRAPPING IN IF TO PREVENT 'set -e' EXIT
if perform_backup "$TARGET_USER" "$DB_PASSWORD" "${BACKUP_DIR}/${BACKUP_FILE}" "$ERROR_LOG"; then
    SUCCESS=0
else
    SUCCESS=1
fi

# Validate primary attempt
if [ $SUCCESS -eq 0 ]; then
     FILE_SIZE_BYTES=$(stat -f%z "${BACKUP_DIR}/${BACKUP_FILE}" 2>/dev/null || stat -c%s "${BACKUP_DIR}/${BACKUP_FILE}" 2>/dev/null)
     if [ -z "$FILE_SIZE_BYTES" ]; then FILE_SIZE_BYTES=0; fi
     
     if [ "$FILE_SIZE_BYTES" -lt 100 ]; then
        SUCCESS=1
        echo -e "${RED}Backup file too small, treating as failure.${NC}"
     fi
fi

# Fallback to mmuser if primary failed (common in this project setup)
if [ $SUCCESS -ne 0 ] && [ "$TARGET_USER" != "mmuser" ]; then
    echo -e "${RED}Primary backup attempt failed.${NC}"
    echo -e "${YELLOW}Falling back to 'mmuser' (superuser)...${NC}"
    
    # Try mmuser (usually no password/trust in this setup)
    if perform_backup "mmuser" "" "${BACKUP_DIR}/${BACKUP_FILE}" "$ERROR_LOG"; then
        SUCCESS=0
    else
        SUCCESS=1
    fi
fi

# Final Check
if [ $SUCCESS -eq 0 ]; then
    # Get file size
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    
    # Double check size again
    FILE_SIZE_BYTES=$(stat -f%z "${BACKUP_DIR}/${BACKUP_FILE}" 2>/dev/null || stat -c%s "${BACKUP_DIR}/${BACKUP_FILE}" 2>/dev/null)
    if [ -z "$FILE_SIZE_BYTES" ]; then FILE_SIZE_BYTES=0; fi
    
    if [ "$FILE_SIZE_BYTES" -gt 100 ]; then
        echo -e "${GREEN}✓ Backup created successfully!${NC}"
        echo -e "  File: ${BACKUP_FILE}"
        echo -e "  Size: ${BACKUP_SIZE}"
        rm "$ERROR_LOG"
    else
        echo -e "${RED}✗ Backup failed (empty file)!${NC}"
        echo -e "${RED}Error details from last attempt:${NC}"
        cat "$ERROR_LOG"
        rm "$ERROR_LOG"
        rm -f "${BACKUP_DIR}/${BACKUP_FILE}"
        exit 1
    fi
else
    echo -e "${RED}✗ Backup failed!${NC}"
    echo -e "${RED}Error details:${NC}"
    cat "$ERROR_LOG"
    rm "$ERROR_LOG"
    rm -f "${BACKUP_DIR}/${BACKUP_FILE}"
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
