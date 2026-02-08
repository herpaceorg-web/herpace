#!/bin/bash
# HerPace Fresh Deployment Script for Mac/Linux
# Run this as the project owner to deploy everything

set -e  # Exit on error

# ============================================================================
# CONFIGURATION
# ============================================================================

PROJECT_ID="project-1a640bec-d526-495e-b87"
REGION="us-central1"

# Database Configuration
DB_INSTANCE="herpace-db"
DB_NAME="herpacedb"
DB_USER="herpace_user"
DB_PASSWORD="RunTheEarth2026!"

# Service Names
BACKEND_SERVICE="herpace-api"
FRONTEND_SERVICE="herpace-frontend"
ARTIFACT_REPO="herpace-repo"

# Security Secrets
JWT_SECRET="xK9mL2pQ7vR5nW8jY4tB6fH1gC3sN0zX9mL2pQ7vR5nW8jY4tB6fH1gC3sN0zK9m"
GEMINI_API_KEY="AIzaSyDoe1w2yfMr9vPo6Ql07d1OYdklo-Tn4yI"
GEMINI_MODEL="gemini-3-flash-preview"

# Cloud SQL Configuration
DB_TIER="db-f1-micro"
DB_STORAGE_SIZE="10GB"
DB_STORAGE_TYPE="SSD"
DB_AVAILABILITY="zonal"

# Future deployer
DEPLOYER_EMAIL="herpaceai@gmail.com"

# ============================================================================
# DISPLAY CONFIGURATION
# ============================================================================

echo "========================================"
echo "HerPace Fresh Deployment"
echo "========================================"
echo ""
echo "Project:  $PROJECT_ID"
echo "Region:   $REGION"
echo "Database: $DB_INSTANCE ($DB_TIER)"
echo ""
echo "This will deploy the complete HerPace application."
echo ""
read -p "Continue with deployment? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

# ============================================================================
# STEP 1: SET ACTIVE PROJECT
# ============================================================================

echo ""
echo "[1/12] Setting active GCP project..."
gcloud config set project $PROJECT_ID

# ============================================================================
# STEP 2: ENABLE APIS
# ============================================================================

echo ""
echo "[2/12] Enabling required Google Cloud APIs..."
echo "This may take 2-3 minutes..."

gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    sqladmin.googleapis.com \
    secretmanager.googleapis.com \
    artifactregistry.googleapis.com \
    compute.googleapis.com \
    storage-api.googleapis.com

echo "[OK] APIs enabled"

# ============================================================================
# STEP 3: GRANT PERMISSIONS
# ============================================================================

echo ""
echo "[3/12] Granting permissions to service accounts and deployer..."

PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo "  Project Number: $PROJECT_NUMBER"
echo "  Granting permissions to deployer ($DEPLOYER_EMAIL)..."

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="user:${DEPLOYER_EMAIL}" \
    --role="roles/owner" \
    --quiet 2>/dev/null || true

echo "  Granting permissions to Cloud Build service account..."

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${CLOUD_BUILD_SA}" \
    --role="roles/storage.admin" \
    --quiet 2>/dev/null || true

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${CLOUD_BUILD_SA}" \
    --role="roles/cloudbuild.builds.builder" \
    --quiet 2>/dev/null || true

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${CLOUD_BUILD_SA}" \
    --role="roles/artifactregistry.writer" \
    --quiet 2>/dev/null || true

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${CLOUD_BUILD_SA}" \
    --role="roles/iam.serviceAccountUser" \
    --quiet 2>/dev/null || true

echo "  Granting logging permissions..."

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${CLOUD_BUILD_SA}" \
    --role="roles/logging.logWriter" \
    --quiet 2>/dev/null || true

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${COMPUTE_SA}" \
    --role="roles/logging.logWriter" \
    --quiet 2>/dev/null || true

echo "  Granting permissions to Compute service account..."

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${COMPUTE_SA}" \
    --role="roles/storage.admin" \
    --quiet 2>/dev/null || true

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${COMPUTE_SA}" \
    --role="roles/artifactregistry.writer" \
    --quiet 2>/dev/null || true

echo "  Waiting for permissions to propagate..."
sleep 10

echo "[OK] Permissions granted"

# ============================================================================
# STEP 4: CREATE CLOUD SQL INSTANCE
# ============================================================================

echo ""
echo "[4/12] Creating Cloud SQL PostgreSQL instance..."
echo "Configuration: $DB_TIER, $DB_STORAGE_SIZE, $DB_AVAILABILITY"
echo "This may take 5-10 minutes..."

# Check if instance exists
EXISTING_INSTANCE=$(gcloud sql instances list --filter="name=$DB_INSTANCE" --format="value(name)" 2>/dev/null || echo "")

if [ -n "$EXISTING_INSTANCE" ]; then
    echo "[OK] Cloud SQL instance already exists: $DB_INSTANCE"
else
    gcloud sql instances create $DB_INSTANCE \
        --database-version=POSTGRES_15 \
        --tier=$DB_TIER \
        --region=$REGION \
        --root-password="$DB_PASSWORD" \
        --storage-type=$DB_STORAGE_TYPE \
        --storage-size=$DB_STORAGE_SIZE \
        --availability-type=$DB_AVAILABILITY \
        --backup \
        --backup-start-time=03:00

    echo "[OK] Cloud SQL instance created"
fi

# Create database
echo "Creating database: $DB_NAME..."
gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE 2>/dev/null || echo "Database may already exist"

# Create user
echo "Creating database user: $DB_USER..."
gcloud sql users create $DB_USER --instance=$DB_INSTANCE --password="$DB_PASSWORD" 2>/dev/null || echo "User may already exist"

# Get connection name
CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE --format="value(connectionName)")
echo "[OK] Connection Name: $CONNECTION_NAME"

# ============================================================================
# STEP 5: CREATE ARTIFACT REGISTRY
# ============================================================================

echo ""
echo "[5/12] Setting up Artifact Registry..."

EXISTING_REPO=$(gcloud artifacts repositories list --location=$REGION --filter="name:$ARTIFACT_REPO" --format="value(name)" 2>/dev/null || echo "")

if [ -n "$EXISTING_REPO" ]; then
    echo "[OK] Artifact Registry repository already exists"
else
    gcloud artifacts repositories create $ARTIFACT_REPO \
        --repository-format=docker \
        --location=$REGION \
        --description="HerPace Docker Images"
    echo "[OK] Artifact Registry repository created"
fi

gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet

# ============================================================================
# STEP 6: CREATE SECRETS
# ============================================================================

echo ""
echo "[6/12] Creating secrets in Secret Manager..."

CONNECTION_STRING="Host=/cloudsql/$CONNECTION_NAME;Database=$DB_NAME;Username=$DB_USER;Password=$DB_PASSWORD;Include Error Detail=true"

# Function to create or update secret
create_secret() {
    local secret_name=$1
    local secret_value=$2

    if gcloud secrets describe $secret_name >/dev/null 2>&1; then
        echo "  Updating secret: $secret_name"
        echo "$secret_value" | gcloud secrets versions add $secret_name --data-file=-
    else
        echo "  Creating secret: $secret_name"
        echo "$secret_value" | gcloud secrets create $secret_name --data-file=- --replication-policy=automatic
    fi
}

create_secret "jwt-secret" "$JWT_SECRET"
create_secret "db-password" "$DB_PASSWORD"
create_secret "db-connection" "$CONNECTION_STRING"
create_secret "gemini-api-key" "$GEMINI_API_KEY"

# Grant access to secrets
echo "  Granting Cloud Run access to secrets..."
for secret in jwt-secret db-connection gemini-api-key; do
    gcloud secrets add-iam-policy-binding $secret \
        --member="serviceAccount:${COMPUTE_SA}" \
        --role="roles/secretmanager.secretAccessor" \
        --quiet 2>/dev/null || true
done

echo "[OK] Secrets created and permissions granted"

# ============================================================================
# STEP 7: BUILD BACKEND
# ============================================================================

echo ""
echo "[7/12] Building backend Docker image..."
echo "Using Cloud Build (this may take 3-5 minutes)..."

cd backend

gcloud builds submit --tag ${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/herpace-api:latest .

if [ $? -ne 0 ]; then
    echo "[ERROR] Backend Docker build failed"
    exit 1
fi

echo "[OK] Backend Docker image built and pushed"

# ============================================================================
# STEP 8: DEPLOY BACKEND
# ============================================================================

echo ""
echo "[8/12] Deploying backend API to Cloud Run..."

gcloud run deploy $BACKEND_SERVICE \
    --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/herpace-api:latest \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --memory=512Mi \
    --cpu=1 \
    --timeout=300 \
    --max-instances=10 \
    --min-instances=0 \
    --port=8080 \
    --add-cloudsql-instances=$CONNECTION_NAME \
    --set-secrets="ConnectionStrings__HerPaceDb=db-connection:latest,ConnectionStrings__CloudSqlConnection=db-connection:latest,Jwt__Secret=jwt-secret:latest,Gemini__ApiKey=gemini-api-key:latest" \
    --set-env-vars="ASPNETCORE_ENVIRONMENT=Production,UseCloudSql=true,Gemini__Model=$GEMINI_MODEL" \
    --quiet

BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region=$REGION --format="value(status.url)")

echo "[OK] Backend deployed: $BACKEND_URL"

# ============================================================================
# STEP 9: RUN MIGRATIONS
# ============================================================================

echo ""
echo "[9/12] Running database migrations..."

# Check if Cloud SQL Proxy exists
if [ ! -f "cloud-sql-proxy" ]; then
    echo "Downloading Cloud SQL Proxy..."
    curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.amd64
    chmod +x cloud-sql-proxy
fi

# Start Cloud SQL Proxy in background
echo "Starting Cloud SQL Proxy..."
./cloud-sql-proxy $CONNECTION_NAME &
PROXY_PID=$!

sleep 5

# Run migrations
cd src/HerPace.API
export ConnectionStrings__HerPaceDb="Host=localhost;Port=5432;Database=$DB_NAME;Username=$DB_USER;Password=$DB_PASSWORD"

dotnet ef database update --project ../HerPace.Infrastructure/HerPace.Infrastructure.csproj

if [ $? -eq 0 ]; then
    echo "[OK] Database migrations applied"
else
    echo "[WARN] Migration may have failed (check if already applied)"
fi

# Stop Cloud SQL Proxy
kill $PROXY_PID 2>/dev/null || true

cd ../../..

# ============================================================================
# STEP 10: UPDATE FRONTEND CONFIG
# ============================================================================

echo ""
echo "[10/12] Updating frontend configuration..."

cd ../frontend

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
# DEPLOYMENT COMPLETE
# ============================================================================

cd ..

echo ""
echo "========================================"
echo "DEPLOYMENT COMPLETE!"
echo "========================================"
echo ""
echo "Your HerPace application is now live!"
echo ""
echo "URLs:"
echo "  Backend API:  $BACKEND_URL"
echo "  Frontend:     $FRONTEND_URL"
echo ""
echo "Database:"
echo "  Instance:     $CONNECTION_NAME"
echo "  Database:     $DB_NAME"
echo ""
echo "Deployer ($DEPLOYER_EMAIL) has been granted Owner role."
echo "They can now run deployments independently using deploy-update.ps1"
echo ""
echo "Test the deployment:"
echo "  curl $BACKEND_URL/health"
echo "  open $FRONTEND_URL"
echo ""

# Save deployment info
cat > deployment-info.txt <<EOF
# HerPace Deployment Information
# Deployed: $(date)

Project ID: $PROJECT_ID
Region: $REGION

Backend URL: $BACKEND_URL
Frontend URL: $FRONTEND_URL

Database Instance: $CONNECTION_NAME
Database Name: $DB_NAME

Cloud Run Services:
- Backend: $BACKEND_SERVICE
- Frontend: $FRONTEND_SERVICE

Artifact Registry: ${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}
EOF

echo "Deployment info saved to: deployment-info.txt"
echo ""
echo "Opening frontend in browser..."
open "$FRONTEND_URL" 2>/dev/null || echo "Please open $FRONTEND_URL in your browser"
