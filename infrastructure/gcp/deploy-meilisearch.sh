#!/bin/bash
# Deploy Meilisearch to Cloud Run
set -e
PROJECT_ID="${GCP_PROJECT_ID:-grandgold-prod}"
REGION="${1:-asia-south1}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Deploying Meilisearch to $REGION..."
gcloud config set project $PROJECT_ID

gcloud builds submit --config=${SCRIPT_DIR}/cloudbuild-meilisearch.yaml . 2>&1

MEILI_KEY="${MEILISEARCH_MASTER_KEY:-grandgold_search_key}"
gcloud run deploy meilisearch \
  --image gcr.io/${PROJECT_ID}/meilisearch \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 512Mi --cpu 1 --min-instances 0 --max-instances 2 \
  --set-env-vars "MEILI_HTTP_ADDR=0.0.0.0:8080,MEILI_MASTER_KEY=${MEILI_KEY}" \
  --quiet

SERVICE_URL=$(gcloud run services describe meilisearch --region $REGION --format 'value(status.url)')
echo "Meilisearch URL: $SERVICE_URL"
echo "Set MEILISEARCH_URL=$SERVICE_URL and MEILISEARCH_MASTER_KEY=$MEILI_KEY for product-service"
