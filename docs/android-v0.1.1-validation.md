# FolioKit Android 0.1.1 local size validation

Date: 2026-10-17. Android adaptation contributor: Mohammad Askar (dr-askar). License: AGPL-3.0.

- Software source commit: `c3e7ddf21ce9822b074c00c63626df82465b6432`.
- APK: `FolioKit-0.1.1-debug.apk`, 223,517,838 bytes (213.16 MiB).
- APK SHA-256: `da6fd7e7f8cd976eb3094908bc4bd9819c13fd43c2b9217d381b7b66e12e1178`.
- Application ID: `io.github.draskar.foliokit`; versionName `0.1.1`; versionCode `2`; minimum Android API 23; target API 35.
- Initial APK: 593,661,002 bytes. Reduction: 62.3%.
- Focused tests: 23 passed (Android translations, exports, packaging safety, existing desktop/browser bridge).
- TypeScript: passed. Next production Android build: passed. Gradle assembleDebug: passed.
- APK validation: required raw engines, all 17 shared message files and routes, legal notices and clean-source revision checked. Signature verified with Android apksigner (v1/v2).
- Chromium browser check at a mobile viewport: Arabic homepage hydrated with RTL; English merge imported two PDFs and downloaded a valid two-page PDF; no uncaught JavaScript/hydration errors.
- Physical Android device/emulator testing: **not performed**. Office/threaded WASM remains experimental. This is a debug preview, not a store release or completed legal audit.

[GitHub prerelease and downloads](https://github.com/dr-askar/FolioKit/releases/tag/v0.1.1-preview.1). The published preview was subsequently rebuilt with the clean-install lockfile and SDK workflow repairs. Its attached source revision, size report and checksums describe that downloadable APK; the local APK/hash above records the earlier measurement, not the CI-signed download. Follow [ANDROID.md](../ANDROID.md) for reproduction, packaging, signing, legal attribution and release instructions.
