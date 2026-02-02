#!/bin/bash
# GrandGold - Deploy single service to GCP Cloud Run
# Usage: ./deploy-service.sh <service-name> <region>

set -e

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-grandgold-prod}"
SERVICE_NAME="${1:-auth-service}"
REGION="${2:-asia-south1}"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}======================================${NC}"
echo -e "${YELLOW}GrandGold Service Deployment${NC}"
echo -e "${YELLOW}======================================${NC}"
echo ""
echo -e "Project: ${GREEN}${PROJECT_ID}${NC}"
echo -e "Service: ${GREEN}${SERVICE_NAME}${NC}"
echo -e "Region:  ${GREEN}${REGION}${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Install it with: brew install google-cloud-sdk"
    exit 1
fi

# Check if authenticated
if ! gcloud auth print-identity-token &> /dev/null; then
    echo -e "${YELLOW}Not authenticated. Running gcloud auth login...${NC}"
    gcloud auth login
fi

# Set project
echo -e "${YELLOW}Setting project...${NC}"
gcloud config set project ${PROJECT_ID}

# Build the Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
if [ -d "services/${SERVICE_NAME}" ]; then
    gcloud builds submit --tag ${IMAGE_NAME} --timeout=20m .
else
    echo -e "${RED}Error: Service directory not found: services/${SERVICE_NAME}${NC}"
    exit 1
fi

# Deploy to Cloud Run
echo -e "${YELLOW}Deploying to Cloud Run...${NC}"
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --concurrency 80 \
    --timeout 60s \
    --set-env-vars "NODE_ENV=production"

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Deployment Successful!${NC}"
echo -e "${GREEN}======================================${NC}"
echo -e "Service URL: ${SERVICE_URL}"
echo ""
