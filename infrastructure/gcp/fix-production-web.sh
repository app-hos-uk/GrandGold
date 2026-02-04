#!/bin/bash
# Fix production 401/404/500: rebuild and redeploy web with correct backend URLs.
# Run from repo root: ./infrastructure/gcp/fix-production-web.sh
# Requires: gcloud logged in, GCP_PROJECT_ID or GCP_PROJECT set (default: grandmarketplace)

set -e
cd "$(git rev-parse --show-toplevel 2>/dev/null || echo .)"

# Project: prefer GCP_PROJECT_ID, then GCP_PROJECT from region-config, then default
if [ -f ./infrastructure/gcp/region-config.env ]; then
  source ./infrastructure/gcp/region-config.env
fi
export GCP_PROJECT_ID="${GCP_PROJECT_ID:-${GCP_PROJECT:-grandmarketplace}}"
REGION="${GCP_REGION:-asia-south1}"

echo "=============================================="
echo "Fix production web (correct API backend URLs)"
echo "=============================================="
echo "Project: $GCP_PROJECT_ID"
echo "Region:  $REGION"
echo ""

./infrastructure/gcp/deploy-web.sh "$REGION"

echo ""
echo "Done. If you still see 404, ensure backend services are deployed:"
echo "  GCP_PROJECT_ID=$GCP_PROJECT_ID pnpm gcp:deploy"
echo "For 401 on login, seed production DB and set auth-service DATABASE_URL."
echo "See: docs/runbooks/09-production-401-404-500.md"
