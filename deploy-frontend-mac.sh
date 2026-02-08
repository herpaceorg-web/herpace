#!/bin/bash
# Deploy Frontend to Google Cloud Run
# Run this after making frontend code changes

set -e  # Exit on error

PROJECT_ID="project-1a640bec-d526-495e-b87"
REGION="us-central1"
SERVICE="herpace-frontend"
REPO="herpace-repo"

echo "========================================"
echo "Deploying Frontend"
echo "========================================"
echo ""

# Navigate to frontend directory
cd "$(dirname "$0")/frontend"

echo "[1/4] Getting backend URL..."
BACKEND_URL=$(gcloud run services describe herpace-api \
  --region=${REGION} \
  --format="value(status.url)" \
  --project=${PROJECT_ID})

echo "Backend URL: $BACKEND_URL"
echo ""

echo "[2/4] Updating .env.production..."
echo "VITE_API_BASE_URL=$BACKEND_URL" > .env.production
echo "[OK] Environment file updated"
echo ""

echo "[3/4] Building Docker image with Cloud Build..."
echo "This may take 2-4 minutes..."
echo ""

gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions="_VITE_API_BASE_URL=$BACKEND_URL,_REGION=${REGION}" \
  --project=${PROJECT_ID} \
  .

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Docker build failed"
    exit 1
fi

echo ""
echo "[OK] Docker image built and pushed"
echo ""

echo "[4/4] Deploying to Cloud Run..."
echo ""

gcloud run deploy ${SERVICE} \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}:latest \
  --region=${REGION} \
  --platform=managed \
  --allow-unauthenticated \
  --memory=256Mi \
  --cpu=1 \
  --timeout=60 \
  --max-instances=10 \
  --min-instances=0 \
  --port=8080 \
  --project=${PROJECT_ID} \
  --quiet

echo ""
echo "========================================"
echo "Frontend Deployment Complete!"
echo "========================================"
echo ""

FRONTEND_URL=$(gcloud run services describe ${SERVICE} \
  --region=${REGION} \
  --format="value(status.url)" \
  --project=${PROJECT_ID})

echo "Frontend URL: $FRONTEND_URL"
echo ""
echo "Opening in browser..."
open "$FRONTEND_URL" 2>/dev/null || echo "Please open $FRONTEND_URL in your browser"
echo ""
echo "View logs:"
echo "  gcloud run services logs read ${SERVICE} --region=${REGION} --limit=50"
echo ""
