#!/bin/bash

# HerPace Quick Deployment Script for macOS
# Deploys code changes to Google Cloud Run (backend + frontend)

set -e  # Exit on any error

# Configuration
PROJECT_ID="herpace-mvp-app"
REGION="us-central1"
BACKEND_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/herpace-repo/herpace-api:latest"
FRONTEND_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/herpace-repo/herpace-frontend:latest"

# Color output
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}[*] Starting HerPace quick deployment...${NC}"
echo -e "${YELLOW}    Project: ${PROJECT_ID}${NC}"
echo -e "${YELLOW}    Region: ${REGION}${NC}"

# Verify gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}[-] gcloud CLI not found. Please install it first.${NC}"
    echo -e "${YELLOW}    Install from: https://cloud.google.com/sdk/docs/install${NC}"
    exit 1
fi

# Check authentication
echo -e "\n${CYAN}[*] Checking gcloud authentication...${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}[-] Not authenticated with gcloud${NC}"
    echo -e "${YELLOW}    Run: gcloud auth login${NC}"
    exit 1
fi
echo -e "${GREEN}[+] Authenticated${NC}"

# Set GCP project
echo -e "\n${CYAN}[*] Setting GCP project...${NC}"
if ! gcloud config set project ${PROJECT_ID} 2>&1; then
    echo -e "${RED}[-] Failed to set GCP project. Please check:${NC}"
    echo -e "${YELLOW}    1. Project '${PROJECT_ID}' exists${NC}"
    echo -e "${YELLOW}    2. You have access to the project${NC}"
    exit 1
fi
echo -e "${GREEN}[+] Project set successfully${NC}"

# Deploy Backend
echo -e "\n${CYAN}[*] Building and pushing backend Docker image...${NC}"
cd backend
gcloud builds submit --tag ${BACKEND_IMAGE} .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[+] Backend image built and pushed${NC}"

    echo -e "\n${CYAN}[*] Deploying backend to Cloud Run...${NC}"
    gcloud run services update herpace-api \
        --image=${BACKEND_IMAGE} \
        --region=${REGION}

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[+] Backend deployed successfully${NC}"

        # Get backend URL
        BACKEND_URL=$(gcloud run services describe herpace-api --region=${REGION} --format="value(status.url)")
        echo -e "${GREEN}    API URL: ${BACKEND_URL}${NC}"
    else
        echo -e "${RED}[-] Backend deployment failed${NC}"
        exit 1
    fi
else
    echo -e "${RED}[-] Backend build failed${NC}"
    exit 1
fi

# Deploy Frontend
echo -e "\n${CYAN}[*] Building and pushing frontend Docker image...${NC}"
cd ../frontend
gcloud builds submit --tag ${FRONTEND_IMAGE} .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[+] Frontend image built and pushed${NC}"

    echo -e "\n${CYAN}[*] Deploying frontend to Cloud Run...${NC}"
    gcloud run services update herpace-frontend \
        --image=${FRONTEND_IMAGE} \
        --region=${REGION}

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[+] Frontend deployed successfully${NC}"

        # Get frontend URL
        FRONTEND_URL=$(gcloud run services describe herpace-frontend --region=${REGION} --format="value(status.url)")
        echo -e "${GREEN}    Frontend URL: ${FRONTEND_URL}${NC}"
    else
        echo -e "${RED}[-] Frontend deployment failed${NC}"
        exit 1
    fi
else
    echo -e "${RED}[-] Frontend build failed${NC}"
    exit 1
fi

# Summary
echo -e "\n${GREEN}[+] Deployment complete!${NC}"
echo -e "\n${CYAN}[*] Service URLs:${NC}"
echo -e "${YELLOW}    API: ${BACKEND_URL}${NC}"
echo -e "${YELLOW}    Frontend: ${FRONTEND_URL}${NC}"
echo -e "\n${CYAN}[*] Test the deployment:${NC}"
echo -e "${YELLOW}    curl ${BACKEND_URL}/api/health${NC}"
