#!/bin/bash
# Deploy without running migrations (you'll run them from Windows)

echo "Skipping step 9 (migrations) - you'll run this from Windows later"
echo ""
echo "Continuing to frontend deployment..."
echo ""

cd /path/to/HerPaceApp

PROJECT_ID="project-1a640bec-d526-495e-b87"
REGION="us-central1"
BACKEND_SERVICE="herpace-api"
FRONTEND_SERVICE="herpace-frontend"
ARTIFACT_REPO="herpace-repo"

# Get backend URL
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region=$REGION --format="value(status.url)")
echo "Backend URL: $BACKEND_URL"

# ============================================================================
# STEP 10: UPDATE FRONTEND CONFIG
# ============================================================================

echo ""
echo "[10/12] Updating frontend configuration..."

cd frontend

# Update .env.production
echo "VITE_API_BASE_URL=$BACKEND_URL" > .env.production

# Update cloudbuild.yaml
sed -i '' "s|herpace-mvp-app|$PROJECT_ID|g" cloudbuild.yaml
sed -i '' "s|_VITE_API_BASE_URL: '.*'|_VITE_API_BASE_URL: '$BACKEND_URL'|g" cloudbuild.yaml
sed -i '' "s|_REGION: '.*'|_REGION: '$REGION'|g" cloudbuild.yaml

echo "[OK] Frontend configuration updated"

# ============================================================================
# STEP 11: BUILD AND DEPLOY FRONTEND
# ============================================================================

echo ""
echo "[11/12] Building frontend Docker image..."
echo "Using Cloud Build (this may take 2-4 minutes)..."

gcloud builds submit \
    --config cloudbuild.yaml \
    --substitutions="_VITE_API_BASE_URL=$BACKEND_URL,_REGION=$REGION" \
    .

if [ $? -ne 0 ]; then
    echo "[ERROR] Frontend Docker build failed"
    exit 1
fi

echo "[OK] Frontend Docker image built"

echo "Deploying frontend to Cloud Run..."

gcloud run deploy $FRONTEND_SERVICE \
    --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/herpace-frontend:latest \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --memory=256Mi \
    --cpu=1 \
    --timeout=60 \
    --max-instances=10 \
    --min-instances=0 \
    --port=8080 \
    --quiet

FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --region=$REGION --format="value(status.url)")

echo "[OK] Frontend deployed: $FRONTEND_URL"

# ============================================================================
# STEP 12: UPDATE CORS
# ============================================================================

echo ""
echo "[12/12] Updating CORS configuration..."

gcloud run services update $BACKEND_SERVICE \
    --region=$REGION \
    --update-env-vars="CORS__AllowedOrigins=$FRONTEND_URL" \
    --quiet

echo "[OK] CORS configuration updated"

# ============================================================================
# DEPLOYMENT COMPLETE (EXCEPT MIGRATIONS)
# ============================================================================

cd ..

echo ""
echo "========================================"
echo "DEPLOYMENT COMPLETE!"
echo "========================================"
echo ""
echo "Backend URL:  $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""
echo "⚠️  IMPORTANT: Database migrations NOT run yet!"
echo ""
echo "The deployer needs to run migrations from Windows:"
echo "  cd C:\\Dev\\HerPaceApp"
echo "  .\\run-migrations-from-windows.ps1"
echo ""
echo "After migrations are run, the app will be fully functional."
echo ""

# Save deployment info
cat > deployment-info.txt <<EOF
# HerPace Deployment Information
# Deployed: $(date)

Project ID: $PROJECT_ID
Region: $REGION

Backend URL: $BACKEND_URL
Frontend URL: $FRONTEND_URL

Database Instance: $(gcloud sql instances describe herpace-db --format="value(connectionName)")
Database Name: herpacedb

⚠️ MIGRATIONS PENDING - Run from Windows: .\\run-migrations-from-windows.ps1

Cloud Run Services:
- Backend: $BACKEND_SERVICE
- Frontend: $FRONTEND_SERVICE

Artifact Registry: ${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}
EOF

echo "Deployment info saved to: deployment-info.txt"
echo ""
echo "Opening frontend in browser..."
open "$FRONTEND_URL" 2>/dev/null || echo "Please open $FRONTEND_URL in your browser"
