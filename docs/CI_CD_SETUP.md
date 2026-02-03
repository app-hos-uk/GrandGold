# GrandGold CI/CD Setup

## Connect GitHub to Cloud Build

1. **Open Cloud Build Triggers**
   - Go to [GCP Console > Cloud Build > Triggers](https://console.cloud.google.com/cloud-build/triggers?project=grandmarketplace)

2. **Create Trigger**
   - Click **Create Trigger**
   - Name: `grandgold-deploy`
   - Event: **Push to a branch**
   - Source: **Connect new repository**
   - Choose **GitHub (Cloud Build GitHub App)**
   - Authenticate with GitHub and select `Sabuanchuparayil/GrandMarketPlace`
   - Branch: `^main$`
   - Configuration: **Cloud Build configuration file**
   - Location: `infrastructure/gcp/cloudbuild-ci.yaml`

3. **Save** – Pushes to `main` will now trigger builds and deploys.

## Manual Run

To run the pipeline manually:

```bash
cd /path/to/GrandMarketPlace
gcloud builds submit --config=infrastructure/gcp/cloudbuild-ci.yaml --project=grandmarketplace .
```

## What Gets Deployed

- auth-service
- product-service  
- order-service
- web app

All deployed to **asia-south1**. For multi-region, use `pnpm gcp:deploy`.
