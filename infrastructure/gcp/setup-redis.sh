#!/bin/bash
# GrandGold - Setup Memorystore Redis
# Usage: ./setup-redis.sh

set -e

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-grandgold-prod}"
INSTANCE_NAME="grandgold-redis"
REGION="asia-south1"
TIER="standard"  # standard for HA
SIZE_GB="5"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}======================================${NC}"
echo -e "${YELLOW}GrandGold Redis Setup${NC}"
echo -e "${YELLOW}======================================${NC}"
echo ""

# Set project
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo -e "${YELLOW}Enabling Redis API...${NC}"
gcloud services enable redis.googleapis.com

# Check if instance exists
if gcloud redis instances describe ${INSTANCE_NAME} --region=${REGION} &> /dev/null; then
    echo -e "${YELLOW}Memorystore Redis instance already exists${NC}"
else
    # Create Memorystore Redis instance
    echo -e "${YELLOW}Creating Memorystore Redis instance...${NC}"
    gcloud redis instances create ${INSTANCE_NAME} \
        --size=${SIZE_GB} \
        --region=${REGION} \
        --tier=${TIER} \
        --redis-version=redis_7_0 \
        --display-name="GrandGold Redis Cache"
fi

# Get instance details
echo -e "${YELLOW}Getting instance details...${NC}"
REDIS_HOST=$(gcloud redis instances describe ${INSTANCE_NAME} --region=${REGION} --format='value(host)')
REDIS_PORT=$(gcloud redis instances describe ${INSTANCE_NAME} --region=${REGION} --format='value(port)')

# Store connection info in Secret Manager
REDIS_URL="redis://${REDIS_HOST}:${REDIS_PORT}"
echo -n "${REDIS_URL}" | gcloud secrets create grandgold-redis-url --data-file=- 2>/dev/null || \
    echo -n "${REDIS_URL}" | gcloud secrets versions add grandgold-redis-url --data-file=-

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Redis Setup Complete!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "Instance Name: ${INSTANCE_NAME}"
echo -e "Host: ${REDIS_HOST}"
echo -e "Port: ${REDIS_PORT}"
echo -e "Region: ${REGION}"
echo ""
echo -e "${YELLOW}Redis URL stored in Secret Manager:${NC}"
echo "- grandgold-redis-url"
echo ""
echo -e "${YELLOW}To use from Cloud Run, configure VPC connector:${NC}"
echo "--vpc-connector=grandgold-connector"
