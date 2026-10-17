# FolioKit Android: build, size and release guide

Independent Android adaptation of [PDFCraft](https://github.com/PDFCraftTool/pdfcraft), licensed under AGPL-3.0. Android adaptation contributor: **Mohammad Askar ([dr-askar](https://github.com/dr-askar))**. Changes began 2026-10-17. Original copyright and acknowledgment notices remain in place; this is not an official upstream release.

## Build

Use Node 22+, a full **Java 21 JDK** (including `javac`), Android Studio and the SDK versions specified in `android/variables.gradle`. Install the SDK and accept its licenses normally. Set `ANDROID_HOME` to the SDK directory or configure `android/local.properties` (never commit it).

```sh
npm ci
npm run android:debug
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`. Open the project with `npm run android:open`. The committed Gradle wrapper is used; no globally installed Gradle is required. Debug APKs are for testing. Store releases require your own private signing key; never commit signing secrets. Increment versionCode/versionName in `android/app/build.gradle` for each release.

The Android app packages the static frontend locally using Capacitor 7. No hosted frontend or document-upload server is configured. Normal HTML file inputs use Android's system picker. Export uses app cache and Android's share sheet, from which users choose Files/Drive/another destination. Cached exports may remain until Android clears cache or the user clears it in Settings. Large exports need extra memory for base64 conversion.

## Test before release

On a physical Android device: import a PDF from Files, merge and split documents, rotate pages, export and reopen the result, cancel file selection and sharing, repeat exports with identical names, test Arabic/RTL, dark mode, the Back button, and offline navigation. Test batch ZIP and workflow exports. Test a large PDF on a low-memory device. Sharing opens a chooser; it does not confirm the receiving app has saved the file.

Office conversion and other threaded WASM features require cross-origin isolation/SharedArrayBuffer. Capacitor's local server does not guarantee those browser capabilities; these features are experimental on Android. OCR language downloads and other remote assets may require internet access. Do not advertise every upstream feature as offline or supported before device testing. Desktop printing is not implemented for Android.

## Release and license checklist

- Keep `LICENSE`, original copyright notices, upstream acknowledgments and third-party notices.
- License the complete derivative work under AGPL-3.0. Record modified files and relevant dates in the release/change history.
- Publish complete corresponding source for the exact APK, including the lockfile, Android project and build scripts. Place a clear source link next to the APK download and make it available at no extra charge. A link only to upstream is insufficient.
- `npm run android:notices` collects installed production-package license texts. Review bundled WASM, fonts, copied viewer assets, and transitive native libraries separately; generated npm notices are not a complete legal audit. Preserve their existing licenses.
- The in-app footer links to bundled license/contributor notices. CI includes the fork URL and exact revision in source metadata.
- The Android CI workflow creates a debug APK and source archive together as an artifact. A manual run with a non-empty `release_tag` publishes them as a GitHub prerelease; it does not publish a store release.

## Upstream contribution

The Android changes are additive; existing desktop Tauri configuration is retained. A pull request can propose this support upstream with Mohammad Askar credited for the Android contribution. Acceptance and upstream attribution policy belong to the maintainers; this fork cannot guarantee acceptance.

## Why the first APK was large

The 0.1.0 debug APK was about **567 MiB**. Inspecting its ZIP entries showed approximately:

| Component | Compressed contribution |
| --- | ---: |
| Repeated locale HTML/RSC payloads across 17 languages | 319 MiB |
| LibreOffice, with both raw and gzip copies | 156 MiB |
| PyMuPDF/Python dependencies | 47 MiB |
| Chinese PDF font | 13 MiB |
| Native Android code and resources | 4 MiB |

This was primarily web-asset duplication, not debug symbols or native Android code. The upstream desktop release `v2026.10.12-6c20c53` also includes large engines: its Windows setup is 417,323,332 bytes and Linux AppImage 505,932,280 bytes ([upstream release](https://github.com/PDFCraftTool/pdfcraft/releases/tag/v2026.10.12-6c20c53)). A Git clone/download size is not an installed application size; compressed engines expand during the build.

### Android size changes in 0.1.1

- Android's locale layout uses `AndroidIntlProvider`: client components load one local JSON message file per locale instead of serializing every translation in every route. All 17 languages remain bundled. Android first displays a short loading screen; translated content appears once the local file loads. Failure shows a retry button. Web/desktop retain server-rendered translations.
- `android:prepare` generates merged translations with English fallbacks and FolioKit branding. It decompresses the Office engines, then removes only their redundant gzip copies. Raw Office WASM/data, PyMuPDF, fonts, license files and all tool routes remain bundled.
- Android skips Cloudflare's asset-chunking postbuild step. An APK has no Cloudflare per-file limit. Packaging refuses stale chunks or missing engine files rather than silently distributing broken tools.
- No remote engine downloads or removal of languages/tools were introduced to meet a smaller download target. Office remains experimental because WebView cross-origin isolation is a separate limitation.

The measured APK size and compressed component breakdown are attached to each release as `apk-report.json`. `scripts/android-apk-report.py` verifies all 17 locale files/routes, required raw engines, absence of duplicate Office gzip/chunks, legal notices, and clean-source metadata. It rejects APKs above a **300 MiB regression budget**. That is a guard against accidental duplication, not a promise that the app can be reduced below 100 MB while retaining every bundled engine.

## Exact build pipeline

```sh
npm ci
npm test -- src/__tests__/components/android/AndroidIntlProvider.test.tsx src/__tests__/lib/android-bridge.test.ts src/__tests__/lib/android-packaging.test.ts src/__tests__/lib/tauri-bridge.test.ts
npm run android:debug
python3 scripts/android-apk-report.py android/app/build/outputs/apk/debug/app-debug.apk
```

`android:debug` runs Next's Android build, Android asset preparation, legal/provenance generation, Capacitor sync, then Gradle `assembleDebug`. Do not replace Android preparation with the website's `npm run postbuild`: that website step deliberately creates assets for Cloudflare hosting. The generated `out/` directory is platform-specific and must be rebuilt when switching between web/desktop and Android. Keep the source checkout clean before making distributable builds; the APK records the source revision and dirty state.

## Publish a GitHub preview

1. Commit and push all changes to this repository.
2. Open **Actions → Android debug and corresponding source → Run workflow** on the intended branch/ref.
3. Leave `release_tag` empty for a downloadable Actions artifact only. Set a new tag such as `v0.1.1-preview.1` to publish a GitHub prerelease after a successful build. The job needs repository Contents write permission only for publishing.
4. The release includes the APK, exact corresponding source archive, `REVISION.txt`, `SHA256SUMS.txt`, `apk-report.json`, legal notices and these build instructions. Never move an existing release tag onto different source or upload an APK built from another revision under it.
5. A locally built preview may also be uploaded with `gh release create`, using an exact commit/tag and `--prerelease`. Always upload its matching source archive and checksums in the same release. Use a notes file with `--notes-file`.

Debug builds use a debug signing key. Different build machines can produce differently signed APKs, so Android may require uninstalling an older preview before installing a newer one; uninstalling clears app-local data. Use your own securely stored signing key for stable updates. Do not commit keys or passwords. This project has not been submitted to Google Play.

## Project provenance and validation

FolioKit repository: https://github.com/dr-askar/FolioKit. Original project: https://github.com/PDFCraftTool/pdfcraft. Android contributor: Mohammad Askar (dr-askar). All derivative code remains AGPL-3.0; inherited notices remain intact. Original desktop/web/Docker publishing workflows are restricted to the upstream repository so pushing this Android project does not automatically publish unrelated products.

Automated build checks are not a physical-device test or a completed legal audit. The 230 npm package notices are included, but bundled WASM/Python wheels/fonts and native transitive dependencies still need a full license/source-availability review before treating this as production distribution. Known device-testing requirements are listed above. A successful APK signature check proves package integrity, not tool correctness on every WebView.

## Local 0.1.1 size validation (2026-10-17)

The APK built from source commit `c3e7ddf21ce9822b074c00c63626df82465b6432` is **223,517,838 bytes (213.16 MiB)**, compared with the initial **593,661,002-byte (566.16 MiB)** APK: a **62.3% reduction**. All 17 languages and required Office/PDF engines are still packaged.

| Component | New compressed contribution |
| --- | ---: |
| LibreOffice | 83.22 MiB |
| PyMuPDF/Python | 47.16 MiB |
| Shared translation JSON files (all languages) | 0.86 MiB |
| Locale routes (all 17 languages) | about 34 MiB |
| Chinese PDF font | 13.04 MiB |
| Native Android code/resources | 4.43 MiB |

The remaining size is largely real bundled engines. Getting below 100 MB would require a separate product decision, such as omitting engines/tools or making them optional downloads, rather than another safe duplicate-file cleanup.

Validation: 23 focused tests passed, TypeScript passed, the production Android frontend and Gradle APK build succeeded, and Android apksigner verified the package. A Chromium browser smoke test loaded Arabic with RTL, loaded the English merge tool, imported two one-page PDFs, and downloaded a valid two-page PDF without uncaught JavaScript/hydration errors. This was **not** a physical-device/emulator test. See [the recorded validation](docs/android-v0.1.1-validation.md), the [preview release](https://github.com/dr-askar/FolioKit/releases/tag/v0.1.1-preview.1), and its attached `apk-report.json` for exact provenance and component sizes.

## Source archive versus Git checkout

Use a Git checkout for releases: the notices generator records `git rev-parse HEAD` and verifies the checkout is clean. For the 0.1.1 preview:

```sh
git clone https://github.com/dr-askar/FolioKit.git
cd FolioKit
git checkout --detach v0.1.1-preview.1
npm ci
npm run android:debug
```

GitHub and `git archive` source archives omit `.git`. If building from a **freshly extracted** corresponding-source archive, restore only its Git metadata before running the commands above. Run the following inside the extracted source directory (not an existing project with unrelated changes):

```sh
git init
git remote add origin https://github.com/dr-askar/FolioKit.git
git fetch --depth=1 origin refs/tags/v0.1.1-preview.1
git reset --mixed FETCH_HEAD
npm ci
npm run android:debug
```

The mixed reset sets HEAD/index to the fetched release revision and leaves the extracted working files in place. A matching, unchanged source archive should then have a clean status. This step requires access to the public repository. Without `.git`, the source-metadata generator intentionally fails rather than attaching an invented source revision to a distributable APK. Node package and Android/Gradle dependency downloads also normally require network access.

## Release upload troubleshooting

A connected integration can allow Git pushes/API calls but reject `uploads.github.com` with `401 Bad credentials`. Do not put tokens in files or the repository, and do not assume that uploading source to `main` has uploaded an APK. Use the manual Android Actions workflow with `release_tag` instead; its publish job receives GitHub's own short-lived repository token with explicit Contents write permission. Select the intended release tag as the workflow ref so its APK and source archive refer to the same revision. Verify the completed GitHub Release asset list and the size report before declaring the APK published. If a prior upload left a draft, inspect it before retrying to avoid duplicate release names or incomplete asset sets.

### CI SDK compatibility and rebuilding a tagged source

The workflow explicitly installs `platform-tools`, `platforms;android-35`, `build-tools;34.0.0` and `build-tools;35.0.0`. Do not use setup-android's legacy default `tools` package: Google no longer supplies it, causing setup to fail before the application build starts.

`build_ref` optionally selects the software source commit/tag independently of the workflow revision. This lets the current workflow infrastructure rebuild an older tagged release without moving that tag. Leave it empty for the selected workflow's own ref. Publishing reads its target revision from the built artifact's `REVISION.txt`, so the uploaded APK, source archive and tag must refer to that software revision. For the 0.1.1 preview, run the workflow from `main` with `build_ref=v0.1.1-preview.1` and `release_tag=v0.1.1-preview.1`. The workflow implementation may be newer than the application source it checks out. Do not move an existing tag to fix a workflow.

### Clean npm installation repair and published build provenance

A clean GitHub runner exposed a missing SWC helper peer entry in the initial lockfile: `npm ci` failed with `Missing: @swc/helpers@0.5.23`. FolioKit now pins `@swc/helpers` 0.5.23 explicitly and commits a synchronized lockfile. Validate lock repairs with the CI npm major version (`npx npm@10 ci --dry-run --ignore-scripts`, followed by a real clean installation and focused tests), rather than relying on an existing node_modules installation. Do not replace `npm ci` with an unlocked `npm install` in release builds.

The earlier local measurement/Chromium validation used source commit `c3e7ddf`. The published `v0.1.1-preview.1` rebuild uses the repaired lockfile and current SDK workflow; its attached `REVISION.txt`, `source-info.json`, `apk-report.json` and `SHA256SUMS.txt` are authoritative for the downloadable APK. Debug keys/build timestamps can change its hash and exact byte count even when the measured size reduction remains the same. The old `v0.1.1-preview` tag records the initial local-build source and is not the download release.

## Diagnosing “App not installed”

The generic installer dialog does not identify a cause. On a first install, a signing conflict with an older installed FolioKit is not an appropriate default diagnosis. Check the exact release APK with Android Package Manager before claiming a fix. `Android APK install compatibility` downloads the public APK, verifies its published checksum, installs it without the test-only `adb install -t` bypass on fresh API 23/35/36 emulators, starts MainActivity, and retains install output, launch output, logcat and a screenshot as Actions artifacts.

The current APK has no native `lib/<ABI>/` libraries: its Java/WebView/WASM code is already architecture independent, so renaming it “universal” or adding ABI splits does not fix an unexplained installer error. Supported Android minimum is API 23 (Android 6). Emulator results cannot guarantee every manufacturer's security policy or an intact download on a physical phone. If installation fails on a phone, the useful diagnostic is the exact Package Manager error from `adb install path/to/FolioKit.apk` (without `-t`). Do not tell users to uninstall an existing app without explaining that app-local data may be lost; do not recommend disabling device protection merely to hide a packaging problem.
