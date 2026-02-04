#!/bin/bash

# Run database migration on production Cloud SQL database
# This script adds the Recovery column directly to production

set -e

echo "This will add the Recovery column to your PRODUCTION database."
echo "The column is nullable, so this is a safe, non-breaking change."
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "Connecting to Cloud SQL and running migration..."

# Get the Cloud SQL connection string
# You'll need to replace this with your actual Cloud SQL instance connection name
INSTANCE_CONNECTION_NAME="herpace-mvp-app:us-central1:herpace-db"

# Option 1: Use gcloud sql connect (simplest)
echo "Running SQL command to add Recovery column..."
gcloud sql connect herpace-db --user=postgres --quiet << 'EOF'
-- Add Recovery column to TrainingSession table
ALTER TABLE "TrainingSessions"
ADD COLUMN IF NOT EXISTS "Recovery" text NULL;

-- Verify the column was added
\d "TrainingSessions"
EOF

echo ""
echo "✅ Recovery column added successfully!"
echo ""
echo "Next steps:"
echo "1. Deploy the backend code"
echo "2. Deploy the frontend code"
echo "3. Test the tabs in the app"
