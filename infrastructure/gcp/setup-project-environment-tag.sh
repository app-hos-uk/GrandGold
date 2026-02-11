#!/bin/bash
# Add 'environment' tag to the GCP project to clear the deploy warning.
# Requires org-level permissions: resourcemanager.tagKeys.create, resourcemanager.tagValues.create,
# and resourcemanager.tagBindings.create (or roles/resourcemanager.tagAdmin).
#
# Usage: ./setup-project-environment-tag.sh [environment_value]
# Example: ./setup-project-environment-tag.sh Production

set -e

PROJECT_ID="${GCP_PROJECT_ID:-${GCP_PROJECT:-grandmarketplace}}"
ENV_VALUE="${1:-Production}"

# Get project number (required for tag binding parent)
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)' 2>/dev/null) || {
  echo "Error: Could not get project number for $PROJECT_ID. Is gcloud configured?" >&2
  exit 1
}

# Get organization ID (project's org)
ORG_ID=$(gcloud projects describe "$PROJECT_ID" --format='value(parent.id)' 2>/dev/null) || true
if [ -z "$ORG_ID" ] || [ "$ORG_ID" = "" ]; then
  echo "Error: Project is not under an organization. Tags require an organization." >&2
  exit 1
fi

echo "Project: $PROJECT_ID (number: $PROJECT_NUMBER)"
echo "Organization: $ORG_ID"
echo "Tag: environment = $ENV_VALUE"
echo ""

# Create tag key if it doesn't exist
if ! gcloud resource-manager tags keys list --parent="organizations/$ORG_ID" --format='value(name)' 2>/dev/null | grep -q "environment"; then
  echo "Creating tag key 'environment'..."
  gcloud resource-manager tags keys create environment \
    --parent="organizations/$ORG_ID" \
    --description="Environment (Production, Staging, Development)"
fi

TAG_KEY_ID=$(gcloud resource-manager tags keys list --parent="organizations/$ORG_ID" --format='value(name)' --filter="shortName:environment" 2>/dev/null | head -1)
if [ -z "$TAG_KEY_ID" ]; then
  echo "Error: Could not get tag key id for 'environment'." >&2
  exit 1
fi

# Create tag value if it doesn't exist
if ! gcloud resource-manager tags values list --parent="$TAG_KEY_ID" --format='value(shortName)' 2>/dev/null | grep -qx "$ENV_VALUE"; then
  echo "Creating tag value '$ENV_VALUE'..."
  gcloud resource-manager tags values create "$ENV_VALUE" --parent="$TAG_KEY_ID"
fi

TAG_VALUE_ID=$(gcloud resource-manager tags values list --parent="$TAG_KEY_ID" --format='value(name)' --filter="shortName:$ENV_VALUE" 2>/dev/null | head -1)
if [ -z "$TAG_VALUE_ID" ]; then
  echo "Error: Could not get tag value id for '$ENV_VALUE'." >&2
  exit 1
fi

# Create binding: attach tag to project
PARENT="//cloudresourcemanager.googleapis.com/projects/$PROJECT_NUMBER"
echo "Binding tag to project..."
gcloud resource-manager tags bindings create \
  --tag-value="$TAG_VALUE_ID" \
  --parent="$PARENT" 2>/dev/null && echo "Done. Project tagged: environment=$ENV_VALUE" || {
  echo "Binding may already exist or permission denied. If denied, ask an org admin to run this script or grant you Tag Admin role." >&2
  exit 1
}
