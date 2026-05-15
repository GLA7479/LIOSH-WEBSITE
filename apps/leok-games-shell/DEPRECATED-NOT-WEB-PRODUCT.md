# Deprecated: Capacitor shell (not the LEOK web product)

This folder was only for a **native Android/iOS shell** experiment. **LEOK is a normal website + browser PWA** — do not use this for production QA.

**Removal:** Delete the entire `apps/leok-games-shell` directory when no process holds files open (close **Android Studio**, stop **Gradle** daemons, then remove the folder in Explorer or `rd /s /q`).

If `android\` refuses to delete on Windows, reboot or use Resource Monitor to find the locking handle, then delete again.
