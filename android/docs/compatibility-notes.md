# Android Version Compatibility

The app targets API 26 (Android 8.0 Oreo) as minimum and API 34 as target SDK.

## Version-Specific Behavior

### API 26-28 (Android 8.0-9.0)

- **Notification Channels**: Required from API 26. Created in `HerPaceFirebaseMessagingService.onCreate()` and `NotificationScheduler`.
- **Network Security Config**: Applied. Cleartext traffic is blocked by default on API 28+; our config enforces this on all versions.
- **Biometric**: Uses `BiometricPrompt` from AndroidX (backports to API 23+). On devices without biometric hardware, `isBiometricAvailable()` returns false and the feature is hidden.
- **EncryptedSharedPreferences**: Uses AndroidX Security Crypto (API 23+). No version-specific issues.
- **WorkManager**: Fully supported on API 26+. Uses `JobScheduler` under the hood.

### API 29-30 (Android 10-11)

- **Scoped Storage**: No impact (app doesn't access external storage).
- **Background Location**: Not applicable (app doesn't use location).
- **Package Visibility**: No impact (app doesn't query other packages).

### API 31-32 (Android 12-12L)

- **Exact Alarms**: `NotificationScheduler` uses `AlarmManager.setExact()` for workout reminders. On API 31+, the `SCHEDULE_EXACT_ALARM` permission may be needed. Current implementation uses WorkManager-based scheduling as primary mechanism.
- **Splash Screen**: Uses the default system splash screen. No custom `SplashScreen` API used.
- **Bluetooth Permissions**: Not applicable.

### API 33 (Android 13)

- **POST_NOTIFICATIONS Runtime Permission**: Declared in AndroidManifest. The app should request this permission at runtime before scheduling notifications. Currently handled by the notification settings flow.
- **Per-App Language**: Not implemented. Uses system locale.
- **Photo Picker**: Not applicable (no image selection).

### API 34 (Android 14)

- **Foreground Service Types**: `SyncWorker` runs as a standard Worker (not foreground service), so no type declaration needed.
- **Predictive Back**: Compatible via `enableEdgeToEdge()` and Compose navigation back handling.
- **Exact Alarm Restrictions**: More restrictive. WorkManager-based scheduling is preferred over AlarmManager.

## Testing Matrix

| Feature | API 26 | API 30 | API 34 |
|---------|--------|--------|--------|
| Login/Signup | Verify | Verify | Verify |
| Room + SQLCipher | Verify | Verify | Verify |
| Push Notifications | Channel created | Channel created | Runtime permission |
| Biometric | HW-dependent | HW-dependent | HW-dependent |
| Background Sync | WorkManager | WorkManager | WorkManager |
| Certificate Pinning | Release only | Release only | Release only |
| Network Security Config | Applied | Applied | Applied |
| Edge-to-edge UI | Partial | Partial | Full |

## Known Limitations

- **API 26-27**: Edge-to-edge display may show status bar overlay issues. The `enableEdgeToEdge()` call is backward-compatible but visuals may differ.
- **Biometric on emulators**: Emulators may not have biometric hardware enrolled. Use `adb -e emu finger touch 1` to simulate fingerprint on emulator.
- **SQLCipher performance**: On older devices (API 26-28), first database open with SQLCipher may take 1-2 seconds due to key derivation.
