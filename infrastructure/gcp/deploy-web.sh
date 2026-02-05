#!/bin/bash
# GrandGold - Deploy web app to GCP Cloud Run
# Usage: ./deploy-web.sh [region]

set -e

PROJECT_ID="${GCP_PROJECT_ID:-grandgold-prod}"
REGION="${1:-asia-south1}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
CLOUDBUILD_CONFIG="${SCRIPT_DIR}/cloudbuild-web.yaml"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}======================================${NC}"
echo -e "${YELLOW}GrandGold Web App Deployment${NC}"
echo -e "${YELLOW}======================================${NC}"
echo ""
echo -e "Project: ${GREEN}${PROJECT_ID}${NC}"
echo -e "Region:  ${GREEN}${REGION}${NC}"
echo ""

if ! command -v gcloud &> /dev/null; then
  echo -e "${RED}Error: gcloud CLI is not installed${NC}"
  exit 1
fi

gcloud config set project ${PROJECT_ID}

echo -e "${YELLOW}Building web image...${NC}"
cd "${PROJECT_ROOT}"
gcloud builds submit \
  --config=${CLOUDBUILD_CONFIG} \
  --timeout=20m \
  .

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Build failed${NC}"
  exit 1
fi

echo -e "${YELLOW}Deploying to Cloud Run...${NC}"
gcloud run deploy web \
  --image gcr.io/${PROJECT_ID}/web \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --concurrency 80 \
  --timeout 60s \
  --set-env-vars "NODE_ENV=production" \
  --quiet

SERVICE_URL=$(gcloud run services describe web --region ${REGION} --format 'value(status.url)')

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Web App Deployed Successfully!${NC}"
echo -e "${GREEN}======================================${NC}"
echo -e "URL: ${SERVICE_URL}"
echo ""
