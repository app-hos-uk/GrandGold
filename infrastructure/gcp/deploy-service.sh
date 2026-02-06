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
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLOUDBUILD_CONFIG="${SCRIPT_DIR}/cloudbuild-service.yaml"
DOCKERFILE="./services/${SERVICE_NAME}/Dockerfile"

if [ ! -f "${DOCKERFILE}" ]; then
    echo -e "${RED}Error: Dockerfile not found at ${DOCKERFILE}${NC}"
    exit 1
fi

gcloud builds submit \
    --config=${CLOUDBUILD_CONFIG} \
    --substitutions=_SERVICE_NAME=${SERVICE_NAME} \
    --timeout=20m \
    .

# Deploy to Cloud Run
echo -e "${YELLOW}Deploying to Cloud Run...${NC}"

# Build environment variables string (non-secret)
ENV_VARS="NODE_ENV=production"

# Optional: pass secrets from Secret Manager (recommended for DATABASE_URL and JWT_SECRET)
# Set DATABASE_SECRET_NAME (e.g. grandgold-db-url) and/or JWT_SECRET_NAME (e.g. JWT_SECRET) to use secrets.
SECRETS_ARGS=""
if [ -n "${DATABASE_SECRET_NAME}" ]; then
    SECRETS_ARGS="${SECRETS_ARGS}DATABASE_URL=${DATABASE_SECRET_NAME}:latest"
fi
if [ -n "${JWT_SECRET_NAME}" ]; then
    [ -n "${SECRETS_ARGS}" ] && SECRETS_ARGS="${SECRETS_ARGS},"
    SECRETS_ARGS="${SECRETS_ARGS}JWT_SECRET=${JWT_SECRET_NAME}:latest"
fi

# Or pass as plain env vars (less secure; avoid for production)
if [ -n "${JWT_SECRET}" ]; then
    ENV_VARS="${ENV_VARS},JWT_SECRET=${JWT_SECRET}"
fi
if [ -n "${DATABASE_URL}" ]; then
    ENV_VARS="${ENV_VARS},DATABASE_URL=${DATABASE_URL}"
fi
if [ -n "${CLOUD_SQL_CONNECTION_NAME}" ]; then
    ENV_VARS="${ENV_VARS},CLOUD_SQL_CONNECTION_NAME=${CLOUD_SQL_CONNECTION_NAME}"
fi
if [ -n "${REDIS_URL}" ]; then
    ENV_VARS="${ENV_VARS},REDIS_URL=${REDIS_URL}"
fi

echo -e "${YELLOW}Environment: ${ENV_VARS}${NC}"
[ -n "${SECRETS_ARGS}" ] && echo -e "${YELLOW}Secrets: ${SECRETS_ARGS}${NC}"

if [ -n "${SECRETS_ARGS}" ]; then
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
    --set-env-vars "${ENV_VARS}" \
    --set-secrets "${SECRETS_ARGS}"
else
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
    --set-env-vars "${ENV_VARS}"
fi

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Deployment Successful!${NC}"
echo -e "${GREEN}======================================${NC}"
echo -e "Service URL: ${SERVICE_URL}"
echo ""
