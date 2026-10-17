# FolioKit 0.1.2 signed universal preview

Software revision: `f64f38e571bfda8c3f8a65f82d3488fb3f5fa7a3`. Later community documentation and publication workflow changes are on main; they do not change the APK software revision.

## Package evidence

- File: `FolioKit-universal.apk`, 203,354,390 bytes (193.93 MiB).
- SHA-256: `f246543f4c1baa0a13e1d53b21a266b0ae8c01d3ef9b0d84e26f2a7432659026`.
- Corresponding-source archive SHA-256: `13f9740f48fd68db4568b409e39f6e6468c9359a85f91342b363081f6b90c622`.
- Package `io.github.draskar.foliokit`, versionName 0.1.2, versionCode 3, minimum API 23, target API 35.
- Non-debuggable, not testOnly. RSA-3072 persistent private distribution key; APK signature schemes v1 and v2 verified.
- Signing certificate SHA-256: `a8c712cf983b8454360f088aa3d2afc3a4243240b07159ccade845dac9067120`.
- ZIP alignment and the APK report passed. All 17 locale routes/messages, required Office engines, AGPL text, contributor notice and clean source metadata are bundled. No native ABI-specific libraries.
- Focused Android suite: 23 tests passed; TypeScript checking passed. Native release build succeeded.

## Installation gate

[Verified publication run](https://github.com/dr-askar/FolioKit/actions/runs/39017456564) passed ordinary `adb install` without `-t`, MainActivity launch, process survival and uncaught Android runtime crash checks on fresh API 23, 35 and 36 x86_64 emulators. Diagnostics are retained as Actions artifacts according to GitHub retention settings.

These are installation/launch checks, not physical-device or full PDF/Office feature validation. Android 6 still requires an updated compatible WebView for the frontend. No root cause was established for the user's original generic installer error on a first installation. The signed Release build is a distribution improvement, not proof of a specific diagnosis.

## Reproducibility and key custody

The local APK's embedded source-info matches the attached source-info and REVISION. Selected native build/source/license files in the archive were checked against the recorded Git revision. No keystore is in the source archive. Public assets were transported through a temporary branch and published by Actions after verification, because connected release uploads and repository Secrets writes were unavailable. The private owner signing backup is outside git and must remain private; future updates require this same key and a higher versionCode.
