# Feature Specification: Hormone-Aware Training Plan System

**Feature Branch**: `001-hormone-aware-training`
**Created**: 2026-01-24
**Status**: Draft
**Input**: User description: "I am building a web app that will eventually be mobile apps. It's a fitness app for women where they enter in a race they are aiming for and put in some health information and it tailors a fitness plan utilizing gen AI API call that can be updated throughout the training plan. They will have workouts suggested but can interact and skip. It uses information about their cycles to suggest optimized plans and give them personalized suggestions."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Personalized Training Plan (Priority: P1)

A woman runner signs up for the app, enters her target race details (date, distance), provides basic health information including cycle data, and receives an AI-generated training plan that adapts to her menstrual cycle phases.

**Why this priority**: This is the core value proposition of HerPace - without this, there is no product. Users need to receive a personalized, hormone-aware training plan to differentiate this from generic running apps.

**Independent Test**: Can be fully tested by completing the onboarding flow, entering race and health data, and verifying a training plan is generated with workouts distributed across different cycle phases.

**Acceptance Scenarios**:

1. **Given** a new user has signed up, **When** they enter their target race (London Marathon 2026, April 26) and health profile (cycle length 28 days, last period start date), **Then** they receive a personalized training plan showing workouts scheduled from today through race day with intensity varying by predicted cycle phase.

2. **Given** a user is completing their profile, **When** they indicate irregular cycles or post-partum status, **Then** the system acknowledges their unique physiology and generates an adapted plan with more recovery emphasis.

3. **Given** a user has selected a race that's less than 4 weeks away, **When** they request a training plan, **Then** the system generates a shorter plan focused on maintaining fitness rather than building volume.

4. **Given** a user has entered their cycle information, **When** they view their training plan, **Then** they can see visual indicators showing which cycle phase each workout falls within (Follicular, Ovulatory, Luteal, Menstrual).

---

### User Story 2 - Interact with Daily Workouts (Priority: P2)

A user views their daily suggested workout, can mark it complete, skip it, or modify it, and the system adapts future suggestions based on their compliance and feedback.

**Why this priority**: User agency is critical for adherence. Without the ability to skip or modify workouts, users will abandon rigid plans when life happens.

**Independent Test**: Can be tested by viewing a week of workouts, completing some, skipping others, and verifying the plan adjusts appropriately without breaking.

**Acceptance Scenarios**:

1. **Given** a user opens the app on a training day, **When** they view today's workout (e.g., "Easy Run 5K - Follicular Phase"), **Then** they see the workout details including duration, intensity, and phase-specific tips (e.g., "Your energy should be high today - great time for quality work").

2. **Given** a user has completed a workout, **When** they mark it as done and optionally add notes (e.g., "Felt great!" or "Struggled"), **Then** the system logs the completion and considers this feedback for future plan adjustments.

3. **Given** a user needs to skip a workout, **When** they select "Skip" and optionally provide a reason (e.g., "Sick", "Injury", "Life"), **Then** the system redistributes remaining workouts intelligently without overloading future weeks.

4. **Given** a user has skipped multiple high-intensity workouts, **When** the system regenerates the plan, **Then** it reduces overall training load to prevent injury and burnout.

---

### User Story 3 - Track Cycle and Receive Phase-Optimized Guidance (Priority: P3)

A user logs cycle events (period start, symptoms, energy levels) and receives personalized insights and workout adjustments based on their current cycle phase.

**Why this priority**: This enhances the hormone-aware intelligence of the app but isn't essential for MVP. Users can still benefit from predicted phases without detailed logging.

**Independent Test**: Can be tested by logging cycle data over multiple weeks and verifying that recommendations evolve based on logged patterns vs. predictions.

**Acceptance Scenarios**:

1. **Given** a user is in their Menstrual phase (period has started), **When** they log this event, **Then** the system automatically adjusts this week's workouts to emphasize recovery and low-intensity activities.

2. **Given** a user is in their Follicular phase, **When** they view recommendations, **Then** they see encouragement to tackle high-intensity interval sessions and strength work since hormones support muscle building and recovery.

3. **Given** a user consistently logs lower energy during the Luteal phase, **When** the system learns this pattern, **Then** future plans proactively reduce intensity during predicted Luteal weeks.

4. **Given** a user has irregular cycles, **When** they log actual phase transitions, **Then** the system updates predictions and adapts the plan in real-time rather than relying on fixed calculations.

---

### User Story 4 - Update Training Plan Throughout Cycle (Priority: P4)

A user who has been following their plan for several weeks can request plan updates based on progress, changing goals, or new health information, and the AI regenerates an optimized continuation.

**Why this priority**: Long-term engagement depends on plan evolution, but initial plan generation (P1) is more critical for proving value.

**Independent Test**: Can be tested by using a plan for 4 weeks, requesting an update with new information (e.g., race date changed, injury recovery), and verifying the plan intelligently adapts.

**Acceptance Scenarios**:

1. **Given** a user has completed 4 weeks of training, **When** they request a plan update and note they've been feeling stronger than expected, **Then** the AI regenerates the remaining weeks with slightly increased intensity while respecting upcoming cycle phases.

2. **Given** a user needs to change their race date, **When** they update the race information (e.g., postponed by 2 weeks), **Then** the system regenerates the plan to peak at the new target date.

3. **Given** a user is recovering from an injury, **When** they indicate reduced capacity and provide return-to-running date, **Then** the plan adjusts to include gradual reintroduction with extra recovery time.

---

### Edge Cases

- What happens when a user enters a race date in the past or less than 1 week away?
  - System displays an error message: "Race date must be at least 1 week in the future to generate a meaningful plan."

- What happens when a user doesn't want to provide cycle information?
  - System allows them to opt out and generates a standard training plan without cycle-phase optimization, with clear messaging about reduced personalization.

- What happens when a user has irregular cycles (PCOS, perimenopause, hormonal contraception)?
  - System provides alternative input methods (e.g., "I don't track cycles", "My cycles are irregular") and generates plans with more conservative intensity distribution and greater flexibility.

- What happens when the AI API fails or returns invalid data?
  - System falls back to rule-based plan generation using training plan templates based on race distance and user fitness level, with a message: "We've created a standard plan for you. Try refreshing later for AI-optimized suggestions."

- What happens when a user skips 2+ weeks of workouts consecutively?
  - System prompts: "We noticed you've been away. Would you like to restart your plan from today, or continue where you left off?" and regenerates accordingly.

- What happens when a user completes a race and wants to start a new goal?
  - System congratulates them, archives the completed plan, and prompts them to enter a new race goal to generate a fresh plan.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create a Runner profile with physiological data including cycle length, typical cycle characteristics, fitness level, and running history.

- **FR-002**: System MUST allow users to enter race details including race name, date, distance, and goal time (optional).

- **FR-003**: System MUST generate a personalized training plan by calling a generative AI API with user profile data, race details, and current date as inputs.

- **FR-004**: System MUST structure training plans into Training Sessions (workouts) distributed across weeks from current date to race date.

- **FR-005**: System MUST predict Cycle Phases (Follicular, Ovulatory, Luteal, Menstrual) based on user-provided cycle data and overlay these phases onto the training plan timeline.

- **FR-006**: System MUST adjust workout intensity and type based on the predicted cycle phase for each session (e.g., high intensity during Follicular, recovery emphasis during Menstrual).

- **FR-007**: Users MUST be able to view their training plan as a schedule showing daily workouts with details including type, duration, intensity, and cycle phase context.

- **FR-008**: Users MUST be able to mark workouts as completed, skipped, or modified, with optional notes or feedback.

- **FR-009**: System MUST log user interactions with workouts (completions, skips, feedback) to inform future plan adjustments.

- **FR-010**: System MUST allow users to request plan regeneration at any point, incorporating their progress and updated health information.

- **FR-011**: System MUST provide phase-specific guidance and tips for each workout based on the associated cycle phase.

- **FR-012**: System MUST allow users to manually log cycle events (period start date, symptoms, energy levels) to improve prediction accuracy.

- **FR-013**: System MUST handle users who opt out of cycle tracking by generating standard training plans without phase optimization.

- **FR-014**: System MUST persist all user data (Runner profile, Training Plans, Sessions, Cycle data) securely with user-private access control.

- **FR-015**: System MUST handle AI API failures gracefully by falling back to template-based plan generation.

- **FR-016**: System MUST validate race dates are at least 1 week in the future before generating plans.

- **FR-017**: System MUST support multiple training plans per user (e.g., user completes one race, starts training for another).

- **FR-018**: System MUST archive completed training plans when the race date has passed.

- **FR-019**: Users MUST be able to update race details (date, distance, goal) and regenerate the plan accordingly.

- **FR-020**: System MUST display cycle phase predictions visually on the training plan calendar/timeline.

### Key Entities

- **Runner (User Profile)**: Represents the user with physiological data (cycle length, fitness level, running history), preferences, and training history. Each user has exactly one Runner profile. Privacy: Strictly Private.

- **Race (Goal Event)**: A specific running event with a fixed date and distance that anchors a Training Plan. Users can have multiple races (1-5 per year). Examples: "London Marathon 2026", "Local 5K". Privacy: User-configurable (public/private toggle).

- **Training Plan**: The overarching program guiding a user's running journey, tailored to a specific Race and user physiology. Contains multiple Training Sessions organized across Cycle Phases. Each plan has a start date (today) and end date (race date). Privacy: Private to user.

- **Cycle Phase**: A distinct period within the menstrual cycle (Follicular, Ovulatory, Luteal, Menstrual) characterized by specific hormonal profiles. System predicts phases based on user cycle data; users can confirm/correct via logging. Influences training session intensity and recovery needs. Privacy: Highly Sensitive (Health Data).

- **Training Session (Workout)**: An individual workout with specific type (e.g., Long Run, Intervals, Rest), duration, intensity, and scheduled date. Belongs to a Training Plan and is influenced by the Cycle Phase it falls within. Users interact with sessions by completing, skipping, or modifying them. Examples: "Long Run 16K", "Interval Session 8x400m", "Rest Day". Privacy: Private.

### Assumptions

- **AI Model Selection**: The generative AI API will be selected during implementation planning. Common options include OpenAI GPT, Anthropic Claude, or specialized fitness AI models. The spec assumes a text-based API that accepts structured user data and returns a training plan in parseable format (JSON recommended).

- **Cycle Phase Calculation**: Standard cycle length is assumed to be 28 days with Follicular (Days 1-13), Ovulation (Day 14), and Luteal (Days 15-28), Menstrual (Days 1-5 overlapping with Follicular). The system will adapt to user-specific cycle lengths provided during onboarding.

- **Authentication**: Users will authenticate via standard email/password or social login (Google, Apple). Implementation details will be determined in planning phase.

- **Data Retention**: User data will be retained as long as the account is active, plus 30 days after account deletion (for recovery). Health data (cycle information) will be handled according to HIPAA/GDPR best practices.

- **Platform Progression**: MVP will be a web application (responsive design for mobile browsers). Native mobile apps (iOS/Android) will be developed in Phase 2 after validating web app with users.

- **Workout Granularity**: Training sessions are daily granularity. The system does not support multiple workouts per day in MVP.

- **Race Database**: MVP will allow manual race entry (name, date, distance). Integration with external race databases (e.g., Active.com, RunSignUp) is a future enhancement.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete onboarding (profile creation + race entry) and receive their first AI-generated training plan in under 5 minutes.

- **SC-002**: At least 80% of generated training plans successfully distribute workouts across the timeline from today to race date without scheduling conflicts.

- **SC-003**: Users can view their daily workout and mark it complete/skip within 3 taps/clicks from app launch.

- **SC-004**: Training plan completion rate (users who complete at least 75% of suggested workouts) exceeds 60% for users who engage with the app for at least 4 weeks.

- **SC-005**: Cycle phase prediction accuracy exceeds 85% when compared to user-logged actual phase transitions (for users who log their cycles).

- **SC-006**: System maintains 99% uptime for core plan generation and workout viewing features.

- **SC-007**: AI API failures result in fallback plan generation within 5 seconds, ensuring no user sees a blank screen or error without a usable plan.

- **SC-008**: Users who skip workouts and request plan regeneration receive updated plans that maintain safe training progression (no week-over-week mileage increase exceeding 10%).

- **SC-009**: 90% of users report (via optional post-onboarding survey) that the cycle-aware guidance feels relevant and helpful to their training.

- **SC-010**: Injury rate among active users (self-reported) remains below 5% per training cycle, demonstrating safe plan progression.

- **SC-011**: User retention at 4 weeks post-signup exceeds 50% (user has logged in and interacted with workouts at least once per week).

- **SC-012**: Mobile web experience (responsive design) maintains full functionality and usability on devices with screen widths down to 360px.

### Business & Engagement Metrics

- **SC-013**: Average session duration exceeds 3 minutes (indicating meaningful engagement with plan and workouts).

- **SC-014**: Users update/regenerate their plan at least once during an 8-week training cycle (indicating active adaptation).

- **SC-015**: 70% of users who complete their race goal create a new race goal within 2 weeks (indicating continued value).
