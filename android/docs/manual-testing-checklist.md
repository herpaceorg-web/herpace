# Manual Testing Checklist

Test each user story flow end-to-end on a physical device or emulator.

## Prerequisites

- App installed (debug build)
- Backend API running (production or local)
- Network connectivity available
- Firebase `google-services.json` configured

---

## US1: Authentication & Onboarding

- [ ] **Signup**: Enter email, password, confirm password -> account created -> navigates to onboarding
- [ ] **Signup validation**: Short password shows error, mismatched passwords shows error
- [ ] **Login**: Enter registered email + password -> navigates to dashboard (if profile exists) or onboarding
- [ ] **Login error**: Wrong credentials shows appropriate error message
- [ ] **Onboarding**: Fill name, age, fitness level, weekly mileage, cycle length, last period date -> save -> navigates to dashboard
- [ ] **Token persistence**: Close app, reopen -> stays logged in (no login screen)
- [ ] **Logout**: Profile screen -> logout -> navigates to login screen

## US2: Race Management

- [ ] **View races**: Navigate to Races tab -> shows list of races (or empty state)
- [ ] **Add race**: Tap add button -> fill name, date, distance, optional goal time -> save -> appears in list
- [ ] **Edit race**: Tap race card -> edit fields -> save -> updated in list
- [ ] **Delete race**: Tap delete -> confirmation dialog -> confirm -> removed from list
- [ ] **Race validation**: Empty name shows error, past date shows warning

## US3: AI Training Plan Generation

- [ ] **Generate plan**: From race detail -> tap "Generate Plan" -> loading state -> plan created
- [ ] **View plan**: Navigate to Plan tab -> shows week-by-week view with sessions
- [ ] **Week navigation**: Tap different weeks -> sessions update accordingly
- [ ] **Calendar view**: Switch to calendar -> shows session dots on dates
- [ ] **Plan generation error**: Disconnect network -> attempt generation -> shows error message

## US4: Daily Training Sessions

- [ ] **Session detail**: Tap a session card -> shows workout type, distance, intensity, notes, cycle phase
- [ ] **Cycle phase indicator**: Colored badge shows current cycle phase with accessible label
- [ ] **Mark complete**: Tap "Mark Complete" -> session shows completion state
- [ ] **Undo completion**: Tap "Undo" on completed session -> reverts to incomplete
- [ ] **Today's workout**: Dashboard shows today's session (if any)

## US5: Workout Logging

- [ ] **Log workout**: From completed session -> tap "Log Workout" -> fill distance, duration, RPE, notes -> save
- [ ] **Workout data**: Logged data persists across app restarts
- [ ] **RPE slider**: 1-10 scale works correctly with labels

## US6: Push Notifications

- [ ] **Notification permission**: App requests POST_NOTIFICATIONS permission on first launch (API 33+)
- [ ] **Notification settings**: Profile -> Notification Settings -> toggle enabled/disabled
- [ ] **Morning reminder**: Set morning time -> reminder triggers at set time
- [ ] **Evening reminder**: Set evening time -> reminder triggers at set time
- [ ] **Notification tap**: Tap notification -> opens session detail screen

## US7: Profile & Settings

- [ ] **View profile**: Navigate to Profile tab -> shows name, fitness level, cycle info
- [ ] **Sync status**: Profile screen shows last sync time
- [ ] **Manual sync**: Tap sync button -> triggers sync -> updates timestamp

## US8: Cycle Tracking

- [ ] **Update cycle**: Profile -> Cycle Tracking -> update last period date -> save
- [ ] **Recalculate phases**: After cycle update -> training plan sessions show updated cycle phases
- [ ] **Cycle length**: Change cycle length -> phases recalculate

---

## Cross-Cutting Concerns

### Offline Behavior
- [ ] Enable airplane mode -> browse cached races, plans, sessions
- [ ] Create race offline -> appears locally -> re-enable network -> syncs to server
- [ ] Complete session offline -> re-enable network -> syncs to server

### Accessibility
- [ ] Enable TalkBack -> navigate all screens -> all elements announced correctly
- [ ] All buttons have content descriptions
- [ ] Touch targets are minimum 48dp
- [ ] Color contrast meets 4.5:1 ratio for text
- [ ] Cycle phase indicators have text labels alongside colors

### Error Handling
- [ ] API errors show user-friendly messages (not raw HTTP codes)
- [ ] Network errors show offline indicator
- [ ] Loading states shown during API calls

### Security
- [ ] Biometric lock: Enable in settings -> background app -> resume -> biometric prompt appears
- [ ] App data not accessible via backup (`adb backup` produces empty)
