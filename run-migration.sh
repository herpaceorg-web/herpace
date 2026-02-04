#!/bin/bash

# Database Migration Script for Recovery Field
# Run this BEFORE deploying the code changes

set -e

echo "Creating database migration for Recovery field..."
dotnet ef migrations add AddRecoveryToTrainingSessions \
  --project backend/src/HerPace.Infrastructure \
  --startup-project backend/src/HerPace.API

echo ""
echo "Applying migration to database..."
dotnet ef database update \
  --project backend/src/HerPace.Infrastructure \
  --startup-project backend/src/HerPace.API

echo ""
echo "✅ Migration completed successfully!"
