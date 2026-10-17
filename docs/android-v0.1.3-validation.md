# FolioKit 0.1.3 mobile preview

Application revision: `7c323ecd3e7bdaf10ab2b026d449b82a204bc511`. The matching source archive and APK-embedded provenance refer to this clean revision. Later README/contributor instructions and the smoke HTTP server SVG MIME correction do not change the application binary.

## Mobile behavior

The Android reader fills the app viewport, keeps navigation compact and puts common touch tools along the bottom. Settings close independently of the active Highlight/Draw/Text mode. Read mode uses one-finger scrolling and PDF.js two-finger pinch zoom. Save serializes annotation storage and exports the marked PDF through the Android share bridge. Closing a changed document asks for confirmation; Android Back closes expanded reader panels first. Desktop/web behavior and the normal PDF.js toolbar are retained.

The Android app header fits narrow phone screens, the desktop updater is hidden, tool cards use two columns, and reference material collapses. All 17 locales and bundled engines remain present. These are shared shell/reader improvements; they do not establish that every inherited tool has a complete phone redesign or physical-device validation.

## Package evidence

- APK: `FolioKit-universal.apk`, **203,449,055 bytes (194.02 MiB)**.
- APK SHA-256: `bc8e2dd30f77f8f303b1d224eac066553b82fa094ab970a861e88dd1a1e5f7da`.
- Alternate ZIP: **203,449,992 bytes**, SHA-256 `347194b28daf8f83b2040356194191be43047692f11808406369e926903cca93`.
- Matching source archive SHA-256: `813b4aef12c294044fbd355f4b575aab98725eba47bd3765a78ede03cb8a009e`.
- Package: `io.github.draskar.foliokit`, versionName 0.1.3, versionCode 4, minSdk 23, targetSdk 35; non-debuggable and not test-only.
- v1/v2 signatures and 16KB ZIP-alignment check passed. Persistent RSA-3072 certificate SHA-256: `a8c712cf983b8454360f088aa3d2afc3a4243240b07159ccade845dac9067120`.
- Same distribution certificate as signed 0.1.2, with a higher versionCode, permits an in-place update. No native ABI-specific libraries or split APK installation requirement.
- APK report passed the 300 MiB regression budget, all 17 locale routes/message files, required raw Office assets, bundled legal notices and clean-source provenance checks.
- Critical source/build/license files in the source archive were compared with the recorded Git revision. No private keystore, signing password or owner backup is included.

## Functional checks

33 focused Android/reader unit tests and TypeScript passed. The full Android production export, Capacitor sync and signed Gradle release build passed.

Chromium exercised the actual exported Android reader at 360x800, 320x640, Arabic/RTL 393x852 and landscape 844x390. Actual touch events created highlights across text and ink strokes, scrolled in Read mode and pinched to zoom. Checks verified 44 CSS px toolbar targets, closed-settings mode persistence, green highlight color, blue 4pt ink, Undo/Redo, and successful reopening of host-exported PDFs with annotation appearances. The unflagged desktop toolbar remained present. Separate geometry checks covered home, merge and split pages at narrow, Arabic and landscape widths.

The proof HTTP server now serves SVG as image/svg+xml, so PDF.js mask icons also render in screenshots; this is a test-server change. The corrected script is equivalent to the local server correction used for the final touch run. Screenshots are browser simulations, not physical-phone screenshots.

## Publication and device limits

The [publication run](https://github.com/dr-askar/FolioKit/actions/runs/39031128339) passed transport checksums, APK signatures/alignment, manifest and content reports, followed by ordinary installation and MainActivity launch on fresh API 23, 35 and 36 emulators. All five jobs, including gated publication, succeeded. Review its individual job results for the exact installation evidence. These are installation/launch checks, not full tool validation or physical-device tests. Android 17/API 37 is outside this emulator gate; the earlier API 37 infrastructure failure remains documented in ANDROID.md. Physical-phone reader, Back-button, share-sheet and keyboard feedback remains useful.

Release files are at [v0.1.3-preview](https://github.com/dr-askar/FolioKit/releases/tag/v0.1.3-preview). The verified ZIP is an alternate download containing the identical APK and extraction instructions. Its published checksum is in SHA256SUMS.txt. The old diagnostic helper validates only the 0.1.2 hash and must not be used for this update. Office/threaded WASM limitations remain documented in ANDROID.md.

Fresh public downloads of the APK and ZIP matched the release checksum file and GitHub asset digests. ZIP CRC and the extracted APK SHA-256 passed, the public source metadata matched the recorded revision, and the prerelease tag points to that same application commit.
