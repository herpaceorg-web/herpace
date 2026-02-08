#!/bin/bash
# Deploy Backend to Google Cloud Run
# Run this after making backend code changes

set -e  # Exit on error

PROJECT_ID="project-1a640bec-d526-495e-b87"
REGION="us-central1"
SERVICE="herpace-api"
REPO="herpace-repo"

echo "========================================"
echo "Deploying Backend API"
echo "========================================"
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/backend"

echo "[1/3] Building Docker image with Cloud Build..."
echo "This may take 3-5 minutes..."
echo ""

gcloud builds submit \
  --tag ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}:latest \
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

echo "[2/3] Getting Cloud SQL connection..."
CONNECTION_NAME=$(gcloud sql instances describe herpace-db \
  --format="value(connectionName)" \
  --project=${PROJECT_ID})

echo "Connection: $CONNECTION_NAME"
echo ""

echo "[3/3] Deploying to Cloud Run..."
echo ""

gcloud run deploy ${SERVICE} \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}:latest \
  --region=${REGION} \
  --platform=managed \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --timeout=300 \
  --max-instances=10 \
  --min-instances=0 \
  --port=8080 \
  --add-cloudsql-instances=${CONNECTION_NAME} \
  --set-secrets="ConnectionStrings__HerPaceDb=db-connection:latest,ConnectionStrings__CloudSqlConnection=db-connection:latest,Jwt__Secret=jwt-secret:latest,Gemini__ApiKey=gemini-api-key:latest" \
  --set-env-vars="ASPNETCORE_ENVIRONMENT=Production,UseCloudSql=true,Gemini__Model=gemini-3-flash-preview,CORS__AllowedOrigins=https://herpace-frontend-5rc4x5fbma-uc.a.run.app" \
  --project=${PROJECT_ID} \
  --quiet

echo ""
echo "========================================"
echo "Backend Deployment Complete!"
echo "========================================"
echo ""

BACKEND_URL=$(gcloud run services describe ${SERVICE} \
  --region=${REGION} \
  --format="value(status.url)" \
  --project=${PROJECT_ID})

echo "Backend URL: $BACKEND_URL"
echo ""
echo "Test health endpoint:"
echo "  curl $BACKEND_URL/health"
echo ""
echo "View logs:"
echo "  gcloud run services logs read ${SERVICE} --region=${REGION} --limit=50"
echo ""
