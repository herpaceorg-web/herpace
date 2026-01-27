# HerPace Deployment Script for Google Cloud
# This script deploys the HerPace application to Google Cloud Run and Cloud Storage

param(
    [string]$ProjectId = "herpace-mvp-app",
    [string]$Region = "us-central1",
    [string]$CloudSqlInstance = "herpace-db",
    [switch]$SkipBuild,
    [switch]$SkipMigrations
)

$ErrorActionPreference = "Stop"

Write-Host "[*] Starting HerPace deployment to Google Cloud..." -ForegroundColor Cyan
Write-Host "    Project: $ProjectId" -ForegroundColor Yellow
Write-Host "    Region: $Region" -ForegroundColor Yellow

# Set the GCP project
Write-Host "`n[*] Setting GCP project..." -ForegroundColor Cyan
$ErrorActionPreference = "Continue"
gcloud config set project $ProjectId 2>&1 | Out-Null
$ErrorActionPreference = "Stop"

# Check if Cloud SQL instance exists
Write-Host "`n[*] Checking Cloud SQL instance..." -ForegroundColor Cyan
$ErrorActionPreference = "Continue"
$sqlInstanceCheck = gcloud sql instances list --filter="name:$CloudSqlInstance" --format="value(name)" 2>&1
$ErrorActionPreference = "Stop"

if (-not $sqlInstanceCheck) {
    Write-Host "    Cloud SQL instance '$CloudSqlInstance' not found." -ForegroundColor Red
    Write-Host "    Creating Cloud SQL instance (this will take 5-10 minutes)..." -ForegroundColor Yellow

    gcloud sql instances create $CloudSqlInstance `
        --database-version=POSTGRES_15 `
        --tier=db-f1-micro `
        --region=$Region `
        --root-password="TempPassword123!" `
        --database-flags=cloudsql.iam_authentication=on

    Write-Host "[+] Cloud SQL instance created" -ForegroundColor Green

    # Create database
    gcloud sql databases create herpacedb --instance=$CloudSqlInstance

    # Create user
    gcloud sql users create herpace_user `
        --instance=$CloudSqlInstance `
        --password="HerPaceUser2026!"

    Write-Host "[+] Database and user created" -ForegroundColor Green
} else {
    Write-Host "[+] Cloud SQL instance exists" -ForegroundColor Green
}

# Store secrets in Secret Manager
Write-Host "`n[*] Setting up Secret Manager..." -ForegroundColor Cyan

# JWT Secret
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "    Creating JWT secret..."
$ErrorActionPreference = "Continue"
echo $jwtSecret | gcloud secrets create jwt-secret --data-file=- --replication-policy="automatic" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    echo $jwtSecret | gcloud secrets versions add jwt-secret --data-file=- 2>&1 | Out-Null
}
$ErrorActionPreference = "Stop"

# Gemini API Key (you'll need to provide this)
Write-Host "`n[!] IMPORTANT: You need to add your Gemini API key to Secret Manager" -ForegroundColor Yellow
Write-Host "    Run this command with your actual API key:" -ForegroundColor Yellow
Write-Host '    echo "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=- --replication-policy="automatic"' -ForegroundColor Cyan

# Database password
$ErrorActionPreference = "Continue"
echo "HerPaceUser2026!" | gcloud secrets create db-password --data-file=- --replication-policy="automatic" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    echo "HerPaceUser2026!" | gcloud secrets versions add db-password --data-file=- 2>&1 | Out-Null
}
$ErrorActionPreference = "Stop"

Write-Host "[+] Secrets configured" -ForegroundColor Green

# Create Artifact Registry repository if it doesn't exist
Write-Host "`n[*] Setting up Artifact Registry..." -ForegroundColor Cyan
$ErrorActionPreference = "Continue"
$repoCheck = gcloud artifacts repositories list --location=$Region --filter="name:herpace-repo" --format="value(name)" 2>&1
$ErrorActionPreference = "Stop"

if (-not $repoCheck) {
    gcloud artifacts repositories create herpace-repo `
        --repository-format=docker `
        --location=$Region `
        --description="HerPace Docker images"
    Write-Host "[+] Artifact Registry repository created" -ForegroundColor Green
} else {
    Write-Host "[+] Artifact Registry repository exists" -ForegroundColor Green
}

# Build and push Docker image
if (-not $SkipBuild) {
    Write-Host "`n[*] Building Docker image..." -ForegroundColor Cyan
    $imageTag = "${Region}-docker.pkg.dev/${ProjectId}/herpace-repo/herpace-api:latest"

    docker build -t $imageTag -f Dockerfile .

    if ($LASTEXITCODE -eq 0) {
        Write-Host "[+] Docker image built successfully" -ForegroundColor Green

        Write-Host "`n[*] Pushing image to Artifact Registry..." -ForegroundColor Cyan
        gcloud auth configure-docker "${Region}-docker.pkg.dev" --quiet
        docker push $imageTag

        Write-Host "[+] Image pushed successfully" -ForegroundColor Green
    } else {
        Write-Host "[-] Docker build failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[*] Skipping Docker build" -ForegroundColor Yellow
}

# Deploy to Cloud Run
Write-Host "`n[*] Deploying API to Cloud Run..." -ForegroundColor Cyan
$imageTag = "${Region}-docker.pkg.dev/${ProjectId}/herpace-repo/herpace-api:latest"
$cloudSqlConnection = "${ProjectId}:${Region}:${CloudSqlInstance}"

gcloud run deploy herpace-api `
    --image=$imageTag `
    --platform=managed `
    --region=$Region `
    --allow-unauthenticated `
    --set-env-vars="ASPNETCORE_ENVIRONMENT=Production,UseCloudSql=true" `
    --set-secrets="ConnectionStrings__HerPaceDb=db-password:latest,Jwt__Secret=jwt-secret:latest,Gemini__ApiKey=gemini-api-key:latest" `
    --add-cloudsql-instances=$cloudSqlConnection `
    --min-instances=0 `
    --max-instances=10 `
    --memory=512Mi `
    --cpu=1 `
    --timeout=300 `
    --port=8080

if ($LASTEXITCODE -eq 0) {
    Write-Host "[+] API deployed to Cloud Run" -ForegroundColor Green

    # Get the service URL
    $serviceUrl = gcloud run services describe herpace-api --region=$Region --format="value(status.url)"
    Write-Host "`n[*] API URL: $serviceUrl" -ForegroundColor Green

    # Run migrations
    if (-not $SkipMigrations) {
        Write-Host "`n[*] Running database migrations..." -ForegroundColor Cyan
        Write-Host "[!] You need to run migrations from your local machine with Cloud SQL Proxy" -ForegroundColor Yellow
        Write-Host "    Run these commands:" -ForegroundColor Cyan
        Write-Host "    1. Download Cloud SQL Proxy: https://cloud.google.com/sql/docs/postgres/connect-admin-proxy" -ForegroundColor Yellow
        Write-Host "    2. Start proxy: ./cloud-sql-proxy $cloudSqlConnection" -ForegroundColor Yellow
        Write-Host "    3. Update appsettings.Development.json with Cloud SQL connection" -ForegroundColor Yellow
        Write-Host "    4. Run migrations:" -ForegroundColor Yellow
        Write-Host "       cd backend\src\HerPace.Infrastructure" -ForegroundColor Yellow
        Write-Host "       dotnet ef database update --startup-project ..\HerPace.API" -ForegroundColor Yellow
    }

    # Frontend deployment instructions
    Write-Host "`n[*] Frontend Deployment:" -ForegroundColor Cyan
    Write-Host "    1. Update frontend API base URL to: $serviceUrl" -ForegroundColor Yellow
    Write-Host "    2. Build frontend:" -ForegroundColor Yellow
    Write-Host "       cd frontend\src\HerPace.Client" -ForegroundColor Yellow
    Write-Host "       dotnet publish -c Release" -ForegroundColor Yellow
    Write-Host "    3. Create Cloud Storage bucket: gsutil mb -l $Region gs://herpace-frontend" -ForegroundColor Yellow
    Write-Host "    4. Upload files: gsutil -m cp -r bin\Release\net8.0\publish\wwwroot\* gs://herpace-frontend/" -ForegroundColor Yellow
    Write-Host "    5. Make bucket public: gsutil iam ch allUsers:objectViewer gs://herpace-frontend" -ForegroundColor Yellow
    Write-Host "    6. Set website config: gsutil web set -m index.html gs://herpace-frontend" -ForegroundColor Yellow

    Write-Host "`n[+] Deployment complete!" -ForegroundColor Green
    Write-Host "`n[*] Next steps:" -ForegroundColor Cyan
    Write-Host "    1. Add your Gemini API key to Secret Manager (see command above)" -ForegroundColor Yellow
    Write-Host "    2. Run database migrations" -ForegroundColor Yellow
    Write-Host "    3. Deploy the frontend" -ForegroundColor Yellow
    Write-Host "    4. Test the API: $serviceUrl/api/health" -ForegroundColor Yellow

} else {
    Write-Host "[-] Cloud Run deployment failed" -ForegroundColor Red
    exit 1
}
