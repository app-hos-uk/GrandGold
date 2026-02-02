#!/bin/bash
# GrandGold - Setup Cloud SQL PostgreSQL Database
# Usage: ./setup-database.sh

set -e

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-grandgold-prod}"
INSTANCE_NAME="grandgold-db"
DATABASE_NAME="grandgold"
REGION="asia-south1"
TIER="db-custom-2-4096"  # 2 vCPU, 4GB RAM
STORAGE_SIZE="50GB"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}======================================${NC}"
echo -e "${YELLOW}GrandGold Database Setup${NC}"
echo -e "${YELLOW}======================================${NC}"
echo ""

# Set project
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo -e "${YELLOW}Enabling required APIs...${NC}"
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com

# Check if instance exists
if gcloud sql instances describe ${INSTANCE_NAME} --project=${PROJECT_ID} &> /dev/null; then
    echo -e "${YELLOW}Cloud SQL instance already exists${NC}"
else
    # Create Cloud SQL instance
    echo -e "${YELLOW}Creating Cloud SQL instance...${NC}"
    gcloud sql instances create ${INSTANCE_NAME} \
        --database-version=POSTGRES_15 \
        --tier=${TIER} \
        --region=${REGION} \
        --storage-size=${STORAGE_SIZE} \
        --storage-auto-increase \
        --backup-start-time=02:00 \
        --availability-type=regional \
        --maintenance-window-day=SUN \
        --maintenance-window-hour=03 \
        --insights-config-query-insights-enabled \
        --insights-config-record-application-tags \
        --insights-config-record-client-address
fi

# Generate and store password
echo -e "${YELLOW}Setting up database user...${NC}"
DB_PASSWORD=$(openssl rand -base64 24)

# Set root password
gcloud sql users set-password postgres \
    --instance=${INSTANCE_NAME} \
    --password="${DB_PASSWORD}"

# Store password in Secret Manager
echo -e "${YELLOW}Storing credentials in Secret Manager...${NC}"
echo -n "${DB_PASSWORD}" | gcloud secrets create grandgold-db-password --data-file=- 2>/dev/null || \
    echo -n "${DB_PASSWORD}" | gcloud secrets versions add grandgold-db-password --data-file=-

# Create database
echo -e "${YELLOW}Creating database...${NC}"
gcloud sql databases create ${DATABASE_NAME} \
    --instance=${INSTANCE_NAME} 2>/dev/null || echo "Database already exists"

# Get connection name
CONNECTION_NAME=$(gcloud sql instances describe ${INSTANCE_NAME} --format='value(connectionName)')

# Create connection string and store it
CONNECTION_STRING="postgresql://postgres:${DB_PASSWORD}@/${DATABASE_NAME}?host=/cloudsql/${CONNECTION_NAME}"
echo -n "${CONNECTION_STRING}" | gcloud secrets create grandgold-db-url --data-file=- 2>/dev/null || \
    echo -n "${CONNECTION_STRING}" | gcloud secrets versions add grandgold-db-url --data-file=-

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Database Setup Complete!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "Instance Name: ${INSTANCE_NAME}"
echo -e "Database Name: ${DATABASE_NAME}"
echo -e "Region: ${REGION}"
echo -e "Connection Name: ${CONNECTION_NAME}"
echo ""
echo -e "${YELLOW}Credentials stored in Secret Manager:${NC}"
echo "- grandgold-db-password"
echo "- grandgold-db-url"
echo ""
echo -e "${YELLOW}To connect from Cloud Run, add this to your service:${NC}"
echo "--add-cloudsql-instances=${CONNECTION_NAME}"
