# FolioKit 0.1.4 validation

Application revision: `e40e6f9d5521026ee8e58ddf04347583cf547ffc`, clean checkout. APK-embedded source metadata, REVISION.txt and the matching source archive agree. Android adaptation: Mohammad Askar (dr-askar), based on PDFCraft, AGPL-3.0; upstream notices retained.

## Package

APK: 203,437,123 bytes (194.01 MiB). Package io.github.draskar.foliokit, versionName 0.1.4, versionCode 5, minSdk 23, targetSdk 35. Non-debuggable, not test-only, no native ABI restrictions or split installation. The APK report verifies 17 locale routes/messages, required raw Office/PDF assets, legal notices, clean provenance and the 300 MiB budget. Signature schemes v1/v2 and the 16KB ZIP-alignment check passed. Persistent certificate SHA-256: a8c712cf983b8454360f088aa3d2afc3a4243240b07159ccade845dac9067120. The same key and higher versionCode allow updating signed 0.1.2/0.1.3 in place.

Critical source/build/license files were compared with the recorded Git revision. The source archive contains no private keystore, signing password or owner backup. SHA256SUMS.txt records APK/source hashes; the publication workflow adds the ZIP checksum after packaging the unchanged APK.

## Behavior and checks

37 focused tests, TypeScript, the full Android production export, Capacitor sync and signed Gradle build passed. Unit tests cover reader export integrity and Back cleanup, independent page inspection, pending Back-listener cleanup and saved grid sizing.

The actual exported app passed Chromium touch checks at 320/360px, Arabic/RTL, German and landscape. Expanded menus have full-width labels and bounded height; sidebar thumbnails stay on screen. Actual touch marking, ink color/width, scrolling, pinch zoom, selected-ink deletion and Undo/Redo passed. The deletion undo notice is bounded to 110px. Saved PDFs reopened with portable annotation appearances. The unflagged desktop viewer retains its toolbar.

Page-tool checks verify sharp thumbnails, adjustable columns, original-page inspection and zoom without selection changes, and correct deletion/export by reopening the result and checking exactly which pages remain. On-demand page 51 inspection, Escape handling and all seven shared preview integrations passed. Proof screenshots are browser simulations with synthetic PDFs, not physical-phone captures.

## Publication gate and limits

The publication workflow independently checks transport checksums, signatures, alignment, manifest and APK contents, then requires ordinary installation and MainActivity launch on fresh API 23/35/36 emulators before publication. See its retained Actions job logs for the installation evidence. These checks do not establish physical-device operation of every tool. API 37 is outside this emulator gate; the earlier emulator boot limitation remains documented in ANDROID.md. Office/threaded WASM limitations remain unchanged.

Use the release ZIP, extract with a phone file manager and install its APK. The old Install Check helper pins only 0.1.2 and will reject this release. See ANDROID.md for usage, all 17 languages, build/signing instructions and remaining limits.

## Immutable public package evidence

```text
228156782ca6ed9e595843f0549b93bd5fae6e9dea6c6eb55f95f7f17632fd5f  FolioKit-universal.apk
b03cc1f511474212526b6d3e8d0c4625c7a969a5ff43f1edf44e9d059c4fc8a4  corresponding-source.tar.gz
```

[Publication/installation run](https://github.com/dr-askar/FolioKit/actions/runs/39035151682). Its API 23/35/36 jobs gate the publish job. [Preview release](https://github.com/dr-askar/FolioKit/releases/tag/v0.1.4-preview). Subsequent main-branch documentation changes do not change the application's recorded revision or move its release tag.

All five publication jobs succeeded, including ordinary installation/activity launch on fresh API 23, 35 and 36 emulators and gated publication. Fresh public APK and ZIP downloads matched their published SHA-256 values; ZIP CRC and the extracted APK checksum passed. Public provenance records the application revision above.

Alternate ZIP: **203,438,060 bytes**, SHA-256 `871107fd1668e9f1c32f49fa1694fcbcd72f6b75c68e1814ab95ec73d93b87e1`. GitHub asset digests agree with the published APK/source/ZIP checksums.
