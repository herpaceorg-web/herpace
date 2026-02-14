# Feature Specification: Fitness Tracker Integration

**Feature Branch**: `002-fitness-tracker-integration`
**Created**: 2026-02-11
**Status**: Draft
**Input**: User description: "We want to integrate with major fitness trackers (Strava, Garmin, Health Connect). Research the most popular activity trackers and we want to implement an API to them so we can pull run data."

## Clarifications

### Session 2026-02-11

- Q: Should imported runs feed into HerPace's AI training plan generation? → A: Yes, imported runs inform AI plan adjustments (compare actual vs. planned, adapt future sessions).
- Q: How should imported activities relate to existing TrainingSession records? → A: Imported activities are stored separately and linked to matching TrainingSession records when a match is found.
- Q: When a user disconnects a fitness service, should they be able to delete imported data? → A: Ask user during disconnect: keep imported data or delete it.
- Q: When duplicate activities are detected across services, which source takes priority? → A: First imported source wins; keep the earliest record, ignore the duplicate.
- Q: Should the system handle activity updates/edits from the source service? → A: No, imported records are a point-in-time snapshot; edits at the source are not reflected.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Connect a Strava Account (Priority: P1)

A runner wants to connect her Strava account to HerPace so that her run data is automatically imported. She navigates to a "Connected Services" screen, taps "Connect Strava," is redirected to Strava's authorization page, grants permission, and returns to HerPace. Her recent running activities from Strava appear in HerPace within moments. Going forward, new runs she records are automatically synced.

**Why this priority**: Strava is the most widely used fitness platform among runners. Many users from different watch brands (Garmin, Apple Watch, COROS, Suunto, Polar) auto-sync to Strava, making it the single integration that covers the broadest user base.

**Independent Test**: Can be fully tested by connecting a Strava account, recording a run, and verifying it appears in HerPace. Delivers immediate value by eliminating manual run data entry.

**Acceptance Scenarios**:

1. **Given** a logged-in user with no connected services, **When** she taps "Connect Strava" and completes authorization, **Then** her Strava account status shows as "Connected" and her recent running activities (up to 30 days) are imported.
2. **Given** a user with a connected Strava account, **When** she completes a new run and it syncs to Strava, **Then** the run automatically appears in HerPace within 5 minutes.
3. **Given** a user with a connected Strava account, **When** she disconnects the service from HerPace, **Then** the connection is revoked, no further data is imported, and she is prompted to choose whether to keep or delete previously imported data from that service.
4. **Given** a user who denies permission during Strava authorization, **When** she returns to HerPace, **Then** the app shows a friendly message explaining the connection was not completed and offers to try again.

---

### User Story 2 - Read Run Data from Health Connect (Priority: P2)

A runner using an Android device wants HerPace to pull her run data from Health Connect, which aggregates data from her wearable (Garmin watch, Fitbit, Samsung watch, etc.). She navigates to "Connected Services," taps "Connect Health Connect," grants the requested permissions on her device, and her recent runs from Health Connect appear in HerPace.

**Why this priority**: Health Connect is the native Android health data hub. Since HerPace has an Android app, this integration provides access to run data from virtually any wearable that syncs with Android, without needing separate integrations for each brand.

**Independent Test**: Can be fully tested on an Android device by granting Health Connect permissions and verifying that running exercises recorded by any connected wearable appear in HerPace.

**Acceptance Scenarios**:

1. **Given** a user on Android with Health Connect installed and running data from a wearable, **When** she grants HerPace read permissions for exercise and heart rate data, **Then** her recent running activities are imported into HerPace.
2. **Given** a user with Health Connect permissions granted, **When** she completes a new run that syncs to Health Connect, **Then** the run appears in HerPace the next time the app is opened or during a background sync.
3. **Given** a user who revokes Health Connect permissions in Android settings, **When** she opens HerPace, **Then** the app detects the revocation, shows a notification, and stops attempting to read data until permissions are re-granted.
4. **Given** a user whose device does not have Health Connect installed, **When** she views the Connected Services screen, **Then** the Health Connect option is either hidden or shows a message guiding her to install it.

---

### User Story 3 - Connect a Garmin Account (Priority: P3)

A runner with a Garmin watch wants to connect her Garmin account directly to HerPace for richer data integration. She navigates to "Connected Services," taps "Connect Garmin," completes authorization, and her Garmin running activities are synced to HerPace. Additionally, HerPace can access Garmin's women's health data (menstrual cycle tracking) if the user opts in, providing even more accurate cycle-aware training adjustments.

**Why this priority**: Garmin is the most popular dedicated running watch brand. Direct integration provides access to richer data than Strava (full activity files, women's health data) and enables future capabilities like pushing training plans to Garmin devices. However, Garmin requires a developer program application, making it a longer-term integration.

**Independent Test**: Can be fully tested by connecting a Garmin account, syncing a run, and verifying activity data (including detailed metrics like cadence, elevation, and heart rate zones) appears in HerPace.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** she taps "Connect Garmin" and completes the authorization flow, **Then** her Garmin account status shows as "Connected" and her recent running activities are imported.
2. **Given** a user with a connected Garmin account, **When** she syncs her Garmin watch after a run, **Then** the run data appears in HerPace automatically.
3. **Given** a user with a connected Garmin account who uses Garmin's menstrual cycle tracking, **When** she opts in to sharing women's health data, **Then** HerPace can use her Garmin cycle data to supplement or replace manually entered cycle information.
4. **Given** a user who disconnects Garmin from HerPace, **When** the disconnection completes, **Then** no further data is synced and the user can reconnect at any time.

---

### User Story 4 - View Imported Run Details (Priority: P1)

A runner who has connected one or more fitness services wants to view the details of an imported run. She opens a run in HerPace and sees distance, duration, average pace, heart rate data, elevation gain, cadence, and a map of her route (if GPS data is available). The data is presented consistently regardless of which service it was imported from.

**Why this priority**: Viewing imported data is the core value proposition of the integration. Without a unified view of run details, connecting services has no visible benefit to the user.

**Independent Test**: Can be fully tested by importing a run from any connected service and verifying that all available data fields display correctly in a consistent format.

**Acceptance Scenarios**:

1. **Given** a user with an imported run from Strava, **When** she views the run details, **Then** she sees distance, duration, pace, heart rate (if available), elevation, cadence, and a route map.
2. **Given** a user with an imported run from Health Connect, **When** she views the run details, **Then** the same data fields are shown in the same format as a Strava-imported run.
3. **Given** an imported run that is missing certain data points (e.g., no heart rate monitor was worn), **When** the user views the run, **Then** missing fields are gracefully omitted rather than showing zeros or errors.

---

### User Story 5 - Manage Connected Services (Priority: P2)

A runner wants to see which fitness services are connected, manage her connections, and understand what data is being synced. She visits the "Connected Services" screen to see all available integrations, their connection status, last sync time, and options to connect or disconnect.

**Why this priority**: Users need transparency and control over their connected accounts and data sharing. This is essential for trust and privacy compliance.

**Independent Test**: Can be fully tested by navigating to the Connected Services screen and verifying that all integrations show accurate status, and that connect/disconnect actions work correctly.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** she opens the Connected Services screen, **Then** she sees all available integrations (Strava, Health Connect, Garmin) with their current connection status.
2. **Given** a user with a connected service, **When** she views that service's details, **Then** she sees the last successful sync time and the number of activities imported.
3. **Given** a user who wants to disconnect a service, **When** she taps "Disconnect" and confirms, **Then** the connection is removed and the status updates immediately.

---

### Edge Cases

- What happens when a user connects both Strava and Health Connect, and the same run appears in both sources? The system must detect and handle duplicate activities to avoid importing the same run twice.
- What happens when a connected service's authorization token expires or is revoked externally? The system must detect invalid tokens and prompt the user to re-authorize.
- What happens when the connected service is temporarily unavailable? The system must handle service outages gracefully, retry failed syncs, and not lose data.
- What happens when a user imports a non-running activity (cycling, swimming)? The system should filter for running activities only and ignore other activity types.
- What happens when imported data has different units or formats across services? The system must normalize all data to consistent units (e.g., kilometers/miles based on user preference, heart rate in BPM).
- What happens when a very old activity is synced (e.g., activity from years ago)? The system should have a reasonable import window (e.g., last 90 days by default) to avoid overwhelming the user with historical data.
- What happens when an imported run does not match any scheduled training session? The system stores it as a standalone imported activity, visible in the activity history but not linked to a plan session. The AI can still consider it when generating future plans.
- What happens when a user edits an activity on the source platform after it was imported? The imported record in HerPace remains unchanged. Imported activities are point-in-time snapshots and do not sync updates from the source.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to connect and disconnect external fitness services (Strava, Health Connect, Garmin) from within the app.
- **FR-002**: System MUST use industry-standard authorization flows (OAuth 2.0 for cloud services, on-device permissions for Health Connect) and securely store authorization tokens.
- **FR-003**: System MUST automatically import new running activities from connected services without requiring manual user action.
- **FR-004**: System MUST import the following run data when available: distance, duration, average pace, heart rate (average and max), cadence, elevation gain, calories, and GPS route.
- **FR-005**: System MUST normalize imported run data to a consistent internal format regardless of the source service.
- **FR-006**: System MUST detect and prevent duplicate activity imports when the same run is available from multiple connected services. The first-imported record is the canonical source; subsequent duplicates from other services are silently discarded.
- **FR-007**: System MUST display imported run details in a unified view showing all available data fields and a route map when GPS data is present.
- **FR-008**: System MUST show a "Connected Services" management screen displaying available integrations, connection status, and last sync time.
- **FR-009**: System MUST handle expired or revoked authorization tokens by notifying the user and prompting re-authorization.
- **FR-010**: System MUST filter imported activities to include only running and treadmill running types, excluding non-running activities.
- **FR-011**: System MUST perform an initial historical import of running activities from the last 30 days when a service is first connected.
- **FR-012**: System MUST allow users to manually trigger a sync refresh for any connected service.
- **FR-013**: System MUST respect user privacy by only requesting the minimum necessary permissions/scopes from each service.
- **FR-014**: System MUST handle service outages gracefully by retrying failed syncs and informing the user of persistent issues.
- **FR-015**: System MUST revoke access tokens with the external service when a user disconnects, not just remove the local record.
- **FR-016**: System MUST make imported run data available to the AI training plan generator so it can compare actual performance against planned sessions and adapt future training recommendations.
- **FR-017**: System MUST automatically match imported runs to scheduled training sessions based on date and activity type, enabling plan adherence tracking.
- **FR-018**: System MUST prompt users during service disconnection to choose whether to keep or delete all previously imported data from that service.
- **FR-019**: When a user chooses to delete imported data on disconnect, the system MUST permanently remove all imported activities from that service, including unlinking any matched training sessions.

### Key Entities

- **Connected Service**: Represents a user's link to an external fitness platform. Attributes include service type (Strava, Garmin, Health Connect), connection status, authorization credentials, last successful sync timestamp, and the associated user.
- **Imported Activity**: Represents a running activity pulled from an external service, stored as a separate entity from TrainingSession. Attributes include external activity ID, source service, activity date/time, distance, duration, average pace, heart rate (average/max), cadence, elevation gain, calories, GPS route data, and an optional link to a matched TrainingSession record. When a match is found (by date and activity type), the imported activity is linked to the training session to enable planned vs. actual comparison. Unmatched imported activities (e.g., ad-hoc runs not in a plan) remain standalone records.
- **Sync Log**: Tracks synchronization events for auditing and troubleshooting. Attributes include sync timestamp, service type, number of activities imported, success/failure status, and any error details.

## Assumptions

- Strava is the primary cloud integration due to its broad user base and well-documented public API. Health Connect is prioritized for Android-native data access. Garmin requires a developer program application and may take longer to implement.
- The initial import window for historical activities when first connecting a service is 30 days. This balances usefulness with avoiding data overload.
- Duplicate detection uses a combination of activity date/time, distance, and duration to identify the same run across services, with a reasonable tolerance (e.g., within 1 minute of start time and 1% of distance). The first-imported record is kept as canonical; later duplicates from other services are discarded.
- For cloud services (Strava, Garmin), real-time sync is achieved via webhooks where available. Polling is used as a fallback.
- Health Connect data is read when the Android app is opened and via periodic background sync.
- Only running and treadmill running activity types are imported. Other activity types (cycling, swimming, walking) are excluded.
- GPS route data is optional and the system handles runs without GPS gracefully.
- The system stores imported activity data in HerPace's own database to ensure data is available even if the external service is disconnected. Imported records are point-in-time snapshots; subsequent edits to the activity on the source platform are not synced back to HerPace.
- Rate limits from external services are respected. The system implements backoff and queuing strategies to stay within limits.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can connect a fitness service and see their imported runs within 5 minutes of completing authorization.
- **SC-002**: 90% of users successfully complete the service connection flow on their first attempt.
- **SC-003**: New running activities from connected services appear in HerPace within 10 minutes of being synced to the source platform.
- **SC-004**: Duplicate activities across multiple connected services are detected and prevented with 95% or greater accuracy.
- **SC-005**: Imported run data displays all available fields (distance, duration, pace, heart rate, elevation, cadence, route map) with correct values matching the source platform.
- **SC-006**: At least 70% of active users connect one or more fitness services within 30 days of the feature launch.
- **SC-007**: Manual run data entry decreases by 50% or more among users with connected services.
- **SC-008**: The Connected Services management screen loads in under 2 seconds and accurately reflects current connection statuses.
