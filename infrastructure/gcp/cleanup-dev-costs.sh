#!/bin/bash
# GrandGold — Delete expensive dev resources to reduce GCP costs
#
# Run this AFTER billing is re-enabled to delete:
#   1. Memorystore Redis instance (~₹6,700/mo saved)
#   2. VPC Access Connector (~₹2,000/mo saved via Compute Engine)
#   3. Multi-region Cloud Run services (keep only asia-south1)
#
# Usage: ./cleanup-dev-costs.sh
#
# To re-enable Redis for production later:
#   ./setup-redis.sh  (use TIER=basic SIZE_GB=1 for cost-effective config)

set -e

PROJECT_ID="${GCP_PROJECT_ID:-grandmarketplace}"
REGION="asia-south1"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}======================================${NC}"
echo -e "${YELLOW}GrandGold — Dev Cost Cleanup${NC}"
echo -e "${YELLOW}======================================${NC}"
echo ""

gcloud config set project ${PROJECT_ID}

# ── 1. Delete Memorystore Redis ──────────────────────
echo -e "${YELLOW}Step 1: Delete Memorystore Redis instance...${NC}"
if gcloud redis instances describe grandgold-redis --region=${REGION} &>/dev/null; then
  echo -e "${RED}Deleting grandgold-redis (saves ~₹6,700/mo)${NC}"
  gcloud redis instances delete grandgold-redis --region=${REGION} --quiet
  echo -e "${GREEN}✓ Redis instance deleted${NC}"
else
  echo -e "${GREEN}✓ No Redis instance found (already deleted)${NC}"
fi

# ── 2. Delete VPC Access Connector ───────────────────
echo -e ""
echo -e "${YELLOW}Step 2: Delete VPC Access Connector...${NC}"
if gcloud compute networks vpc-access connectors describe grandgold-connector --region=${REGION} &>/dev/null; then
  echo -e "${RED}Deleting grandgold-connector (saves ~₹2,000/mo via Compute Engine)${NC}"
  gcloud compute networks vpc-access connectors delete grandgold-connector --region=${REGION} --quiet
  echo -e "${GREEN}✓ VPC connector deleted${NC}"
else
  echo -e "${GREEN}✓ No VPC connector found (already deleted)${NC}"
fi

# ── 3. Delete multi-region Cloud Run services ────────
echo -e ""
echo -e "${YELLOW}Step 3: Delete non-primary region Cloud Run services...${NC}"
EXTRA_REGIONS=("europe-west2" "us-west1")
SERVICES=$(gcloud run services list --region=${REGION} --project=${PROJECT_ID} --format="value(metadata.name)" 2>/dev/null | sort -u)

for extra_region in "${EXTRA_REGIONS[@]}"; do
  echo -e "  Checking region: ${extra_region}..."
  EXTRA_SERVICES=$(gcloud run services list --region=${extra_region} --project=${PROJECT_ID} --format="value(metadata.name)" 2>/dev/null)
  for svc in $EXTRA_SERVICES; do
    echo -e "    ${RED}Deleting ${svc} in ${extra_region}${NC}"
    gcloud run services delete ${svc} --region=${extra_region} --project=${PROJECT_ID} --quiet 2>/dev/null || true
  done
done
echo -e "${GREEN}✓ Multi-region cleanup done${NC}"

# ── 4. Clean up old container images ─────────────────
echo -e ""
echo -e "${YELLOW}Step 4: Clean up old container images (keep latest 3)...${NC}"
for svc in auth-service kyc-service seller-service fintech-service order-service payment-service product-service inventory-service promotion-service notification-service ai-service cms-service web; do
  IMAGES=$(gcloud container images list-tags gcr.io/${PROJECT_ID}/${svc} --format="value(digest)" --sort-by=~timestamp 2>/dev/null | tail -n +4)
  COUNT=$(echo "$IMAGES" | grep -c "sha256" 2>/dev/null || true)
  COUNT=${COUNT:-0}
  if [ "$COUNT" -gt 0 ] 2>/dev/null; then
    echo "  Cleaning ${COUNT} old images for ${svc}..."
    for digest in $IMAGES; do
      gcloud container images delete "gcr.io/${PROJECT_ID}/${svc}@${digest}" --quiet --force-delete-tags 2>/dev/null || true
    done
  fi
done
echo -e "${GREEN}✓ Image cleanup done${NC}"

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Cleanup Complete!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo "Estimated monthly savings:"
echo "  Memorystore Redis:  ~₹6,700/mo"
echo "  VPC Connector:      ~₹2,000/mo"
echo "  Multi-region:       ~₹200/mo"
echo "  Old images:         ~₹30/mo"
echo "  ─────────────────────────────────"
echo "  Total:              ~₹8,930/mo"
echo ""
echo "Remaining costs (expected):"
echo "  Cloud SQL:          ~₹555/mo"
echo "  Cloud Run:          ~₹13/mo (scale-to-zero)"
echo "  Secret Manager:     ~₹33/mo"
echo "  Storage:            ~₹5/mo"
echo "  ─────────────────────────────────"
echo "  Total:              ~₹606/mo"
