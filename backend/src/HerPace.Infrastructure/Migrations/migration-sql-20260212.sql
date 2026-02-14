-- Migration SQL for 2026-02-12 migrations
-- Generated from EF Core migrations (idempotent - safe to re-run)

-- ============================================================
-- Migration 1: AddFitnessTrackerEntities (20260212031538)
-- ============================================================
START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260212031538_AddFitnessTrackerEntities') THEN
    ALTER TABLE training_plans ADD "PendingRecalculationPreviewJson" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260212031538_AddFitnessTrackerEntities') THEN
    ALTER TABLE training_plans ADD "PendingRecalculationSummary" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260212031538_AddFitnessTrackerEntities') THEN
    ALTER TABLE training_plans ADD "PreviewGeneratedAt" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260212031538_AddFitnessTrackerEntities') THEN
    CREATE TABLE connected_services (
        "Id" uuid NOT NULL,
        "RunnerId" uuid NOT NULL,
        "Platform" integer NOT NULL,
        "Status" integer NOT NULL DEFAULT 0,
        "ExternalUserId" character varying(200),
        "AccessToken" character varying(2000),
        "RefreshToken" character varying(2000),
        "TokenExpiresAt" timestamp with time zone,
        "Scopes" character varying(500),
        "ConnectedAt" timestamp with time zone NOT NULL,
        "DisconnectedAt" timestamp with time zone,
        "LastSyncAt" timestamp with time zone,
        "LastSyncError" character varying(2000),
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_connected_services" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_connected_services_runners_RunnerId" FOREIGN KEY ("RunnerId") REFERENCES runners ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260212031538_AddFitnessTrackerEntities') THEN
    CREATE TABLE imported_activities (
        "Id" uuid NOT NULL,
        "RunnerId" uuid NOT NULL,
        "Platform" integer NOT NULL,
        "ExternalActivityId" character varying(200) NOT NULL,
        "TrainingSessionId" uuid,
        "ActivityDate" timestamp with time zone NOT NULL,
        "ActivityType" character varying(50) NOT NULL,
        "ActivityTitle" character varying(500),
        "DistanceMeters" double precision,
        "DurationSeconds" integer,
        "MovingTimeSeconds" integer,
        "AveragePaceSecondsPerKm" double precision,
        "AverageHeartRate" integer,
        "MaxHeartRate" integer,
        "Cadence" integer,
        "ElevationGainMeters" double precision,
        "CaloriesBurned" integer,
        "GpsRouteJson" jsonb,
        "RawResponseJson" jsonb,
        "ImportedAt" timestamp with time zone NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_imported_activities" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_imported_activities_runners_RunnerId" FOREIGN KEY ("RunnerId") REFERENCES runners ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_imported_activities_training_sessions_TrainingSessionId" FOREIGN KEY ("TrainingSessionId") REFERENCES training_sessions ("Id") ON DELETE SET NULL
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260212031538_AddFitnessTrackerEntities') THEN
    CREATE TABLE sync_logs (
        "Id" uuid NOT NULL,
        "ConnectedServiceId" uuid NOT NULL,
        "RunnerId" uuid NOT NULL,
        "Platform" integer NOT NULL,
        "SyncType" character varying(50) NOT NULL,
        "StartedAt" timestamp with time zone NOT NULL,
        "CompletedAt" timestamp with time zone,
        "ActivitiesFound" integer NOT NULL,
        "ActivitiesImported" integer NOT NULL,
        "ActivitiesDuplicate" integer NOT NULL,
        "ActivitiesFiltered" integer NOT NULL,
        "Success" boolean NOT NULL,
        "ErrorMessage" character varying(4000),
        "ErrorCode" character varying(100),
        CONSTRAINT "PK_sync_logs" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_sync_logs_connected_services_ConnectedServiceId" FOREIGN KEY ("ConnectedServiceId") REFERENCES connected_services ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_sync_logs_runners_RunnerId" FOREIGN KEY ("RunnerId") REFERENCES runners ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260212031538_AddFitnessTrackerEntities') THEN
    CREATE UNIQUE INDEX "IX_connected_services_RunnerId_Platform" ON connected_services ("RunnerId", "Platform");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260212031538_AddFitnessTrackerEntities') THEN
    CREATE UNIQUE INDEX "IX_imported_activities_Platform_ExternalActivityId" ON imported_activities ("Platform", "ExternalActivityId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260212031538_AddFitnessTrackerEntities') THEN
    CREATE INDEX "IX_imported_activities_RunnerId_ActivityDate" ON imported_activities ("RunnerId", "ActivityDate");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260212031538_AddFitnessTrackerEntities') THEN
    CREATE INDEX "IX_imported_activities_RunnerId_Platform" ON imported_activities ("RunnerId", "Platform");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260212031538_AddFitnessTrackerEntities') THEN
    CREATE INDEX "IX_imported_activities_TrainingSessionId" ON imported_activities ("TrainingSessionId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260212031538_AddFitnessTrackerEntities') THEN
    CREATE INDEX "IX_sync_logs_ConnectedServiceId" ON sync_logs ("ConnectedServiceId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260212031538_AddFitnessTrackerEntities') THEN
    CREATE INDEX "IX_sync_logs_RunnerId" ON sync_logs ("RunnerId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260212031538_AddFitnessTrackerEntities') THEN
    CREATE INDEX "IX_sync_logs_StartedAt" ON sync_logs ("StartedAt" DESC);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260212031538_AddFitnessTrackerEntities') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260212031538_AddFitnessTrackerEntities', '8.0.24');
    END IF;
END $EF$;
COMMIT;

-- ============================================================
-- Migration 2: AddGarminWomensHealthOptIn (20260212140054)
-- ============================================================
START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260212140054_AddGarminWomensHealthOptIn') THEN
    ALTER TABLE connected_services ADD "WomensHealthDataOptIn" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260212140054_AddGarminWomensHealthOptIn') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260212140054_AddGarminWomensHealthOptIn', '8.0.24');
    END IF;
END $EF$;
COMMIT;
