#!/bin/bash
# GrandGold - Deploy all services to GCP Cloud Run (multi-region)
# Usage: ./deploy-all.sh

set -e

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-grandgold-prod}"
REGIONS=("asia-south1" "europe-west2" "me-central1")
SERVICES=(
    "auth-service"
    "seller-service"
    "fintech-service"
    "order-service"
    "payment-service"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}GrandGold Multi-Region Deployment${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo -e "Project: ${GREEN}${PROJECT_ID}${NC}"
echo -e "Services: ${GREEN}${SERVICES[*]}${NC}"
echo -e "Regions: ${GREEN}${REGIONS[*]}${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    exit 1
fi

# Set project
gcloud config set project ${PROJECT_ID}

# Build all service images
echo -e "${YELLOW}Building all service images...${NC}"
for service in "${SERVICES[@]}"; do
    echo -e "${BLUE}Building ${service}...${NC}"
    IMAGE_NAME="gcr.io/${PROJECT_ID}/${service}"
    gcloud builds submit --tag ${IMAGE_NAME} --timeout=20m . &
done

# Wait for all builds to complete
wait
echo -e "${GREEN}All images built successfully!${NC}"

# Deploy to all regions
echo -e "${YELLOW}Deploying to all regions...${NC}"
for service in "${SERVICES[@]}"; do
    IMAGE_NAME="gcr.io/${PROJECT_ID}/${service}"
    
    for region in "${REGIONS[@]}"; do
        echo -e "${BLUE}Deploying ${service} to ${region}...${NC}"
        
        gcloud run deploy ${service} \
            --image ${IMAGE_NAME} \
            --platform managed \
            --region ${region} \
            --allow-unauthenticated \
            --memory 512Mi \
            --cpu 1 \
            --min-instances 0 \
            --max-instances 10 \
            --concurrency 80 \
            --timeout 60s \
            --set-env-vars "NODE_ENV=production" \
            --quiet &
    done
done

# Wait for all deployments to complete
wait

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}All Services Deployed Successfully!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# List all deployed services
echo -e "${YELLOW}Deployed Services:${NC}"
for region in "${REGIONS[@]}"; do
    echo -e "${BLUE}Region: ${region}${NC}"
    gcloud run services list --region ${region} --format 'table(SERVICE,REGION,URL)'
    echo ""
done
