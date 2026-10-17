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

## Signed universal release builds (0.1.2+)

`FolioKit-universal.apk` is the non-debuggable, non-test-only distribution build. It has no native ABI-specific libraries and does not use split APK installation: the same file is intended for ARM/ARM64/x86/x86_64 Android devices meeting the OS/WebView requirements. Minimum Android remains 6/API 23; a sufficiently current Android System WebView is required for the JavaScript/WASM frontend. “Universal” does not guarantee every OEM security policy, every WebView, or phones older than Android 6.

```sh
npm ci
# Set these only for the build process; keep the key outside the checkout:
export ANDROID_SIGNING_KEYSTORE=/private/path/foliokit-release.p12
# Supply ANDROID_SIGNING_PASSWORD through your private environment/secret manager.
npm run android:release
```

Output: `android/app/build/outputs/apk/release/app-release.apk`. Gradle fails release builds without a signing key/password rather than creating an unsigned APK. The key alias is `foliokit`. Release version 0.1.2 uses versionCode 3. A distribution key is distinct from previous machine-generated Android debug keys; existing debug installs cannot be upgraded in place with a differently signed release. Explain data loss before suggesting uninstalling one. Future release updates must keep the same distribution key and increase versionCode.

The distribution key is generated outside the repository and a private owner backup is retained separately. Never put the PKCS12, its password, or the private backup in git, Actions caches, or public release artifacts. Repository Actions secrets `ANDROID_KEYSTORE_BASE64` and `ANDROID_KEYSTORE_PASSWORD` enable automatic signed builds. The connected integration could not write these secrets (GitHub returned 403 for the Secrets API), so an owner must configure them through repository Settings → Secrets and variables → Actions before using automatic release signing. Do not claim the secrets were stored when that API call failed. A local signing build remains possible without those GitHub secrets.

The Android workflow accepts `build_type=release` (manual default) or `debug` (developer/PR checks). Signed publication is gated on ordinary installation and activity launch in fresh API 23, 35 and 36 emulators, plus signature, ZIP alignment, architecture, manifest, provenance and size checks. Screenshots/UI hierarchy collection are diagnostic only: inability to dump an animated UI must not turn a successful installation into a false install failure. The separate install compatibility workflow can verify a draft release with its short-lived read token before public publication.

### Evidence for the original generic installer report

The original 0.1.1 release APK's published checksum, v1/v2 signatures, ZIP alignment and manifest were verified. It contains no native ABI libraries and is not marked testOnly. Fresh API 23 and 36 emulator jobs installed and launched it successfully. API 35's Package Manager also reported `Success`; that job failed later while collecting an optional UI dump. These observations do not establish the cause of the generic “App not installed” dialog on the user's first physical-phone attempt. Do not describe the distribution signing change as a proven diagnosis of that phone. No existing-install signing conflict should be asserted after the user says this was their first install.

### Publishing a locally signed release

When the connected integration cannot store Actions signing secrets or upload release assets directly, `Verify and publish locally signed Android package` can publish an already signed local APK without exposing its key. Package only public release assets (APK, corresponding source, notices, checksums and provenance) in a tar archive. Transfer it through a temporary delivery branch in chunks below GitHub's per-file limit, record the archive SHA-256, and dispatch the workflow with that branch, digest and a new release tag. Never include private keys or owner backups. The workflow verifies transport, signatures, alignment, manifest flags and packaging; it runs the same API 23/35/36 installation gate before uploading a prerelease with its own short-lived token. Delete the temporary delivery branch after verified publication. The release tag targets the software revision inside REVISION.txt, which can precede later documentation/workflow commits. Future automatic source builds still require the signing secrets described above.

## On-device installation diagnostics

If the official 0.1.2 universal APK is still rejected with only “App not installed”, use the separate [native install diagnostic helper](tools/install-check/README.md). It verifies the downloaded file and requests a normal, user-confirmed PackageInstaller session so Android's actual result can be copied without a computer or phone-model disclosure. It does not bypass Android security, silently install apps, upload data, or prove the cause in advance. Its public permission surface is only REQUEST_INSTALL_PACKAGES; it uses the system file picker for one explicitly selected APK. The helper needs storage for a private copy plus installation staging. It cannot help if the phone also refuses to install the helper. Signing/native packaging changes should follow evidence from that report rather than another blind release.

### Same-size download with a different checksum

A phone report for the 0.1.2 APK identified 203,354,390 bytes but SHA-256 `980933be71fc30675a2c66cbb5e8714dd5f7a8516f79ceb5b29937861ca30d0b`. The public release asset, its GitHub asset digest, published checksum and a fresh download all match `f246543f4c1baa0a13e1d53b21a266b0ae8c01d3ef9b0d84e26f2a7432659026`. Equal length does not establish file integrity. The report does not show how the differing bytes arose, and it is not evidence of a signing conflict, storage shortage or specific OS incompatibility. Do not loosen the helper's checksum check to install an unverified file.

The alternate `FolioKit-0.1.2-verified.zip` release asset contains the same unchanged APK, a checksum file and extraction instructions. Its ZIP CRC catches many transfer/extraction problems; the helper must still confirm the SHA-256 after extraction. `Package verified FolioKit download as ZIP` downloads and verifies the immutable release APK, packages it, verifies the archived bytes, and adds a new asset without replacing the APK or moving its tag. This is an alternate transfer format, not a newly fixed application. The user's reported Android 17/API 37 remains outside the previous API 23/35/36 emulator validation; a matching download is required before drawing installation conclusions for that OS.


### Android 17 check limitation

The optional `android_api=37.0` input in `Android APK install compatibility` selects the official `android-37.0;google_apis;x86_64` image. [Run 39022411419](https://github.com/dr-askar/FolioKit/actions/runs/39022411419) downloaded and verified the official APK but timed out while booting that emulator; ADB remained offline and the APK installation script never ran. This is an infrastructure failure, not an APK rejection or a compatibility pass. API 37 compatibility remains unverified. Future optional API 37 checks have a bounded five-minute boot wait and a 15-minute job limit. Resolve the checksum mismatch on the affected phone before interpreting any installation result there.

## Mobile reading and touch controls (0.1.3)

On Android phones, opening a PDF in the reader fills the available app viewport. The filename/save/close row stays compact; PDF navigation and zoom use one top row, and Read, Highlight, Draw, Text, tool settings and Undo use one bottom row. Buttons have at least 44 CSS px touch targets. Tool settings open separately and close with **Done**, a tap on the document, or Android Back, while the selected annotation tool remains active. More actions, images/signatures (when enabled by PDF.js), Redo, search and thumbnails remain accessible through the viewer controls.

Select **Read / scroll** (hand icon) to navigate the document. One-finger scrolling and two-finger pinch zoom are supported by PDF.js. Highlight mode draws a freehand marker immediately across text or page margins; Draw creates ink strokes. Color/width choices stay applied after closing settings. The Save button now serializes PDF.js annotation storage and exports that PDF through the existing Android share bridge instead of exporting the untouched input. Closing a marked document asks the user to confirm they have saved a copy; the share sheet cannot confirm that a receiving app persisted it. Android Back closes expanded settings/search/menu/sidebar first, then the document, with the same unsaved-change confirmation. The App plugin listener is scoped to the open reader and removed on exit.

The Android shell also uses a smaller header, shorter tool introductions, two-column tool cards and collapsible tool reference material. All 17 languages and tools/engines are retained. Desktop/web layouts and the unflagged PDF.js viewer keep their normal toolbar. The mobile viewer adapter is enabled only with the Android reader's `foliokitMobile=1` URL parameter and a narrow/coarse-pointer viewport. New controls use labels for all 17 application locales, and PDF.js follows the selected app language.

### Reproduce touch regression checks

```sh
npm ci
npx playwright install chromium
# Set BROWSER_EXECUTABLE to your installed Chromium binary if needed.
BROWSER_EXECUTABLE=/path/to/chromium npm run test:mobile
# After an Android frontend export, exercise the complete reader and Save button:
FOLIOKIT_STATIC_DIR=out BROWSER_EXECUTABLE=/path/to/chromium npm run test:mobile
```

The script serves only local synthetic PDF fixtures and local assets. It sends actual Chromium touch events for marking, scrolling and pinching, verifies mode persistence with settings closed, color/width persistence, Undo/Redo, and reopens exported PDFs to check annotations and their appearances. It covers 320 px and 360 px widths, Arabic/RTL and landscape, and checks the desktop toolbar is retained. Set `FOLIOKIT_UI_OUTPUT` to choose where screenshots and exported fixture PDFs are written (default `/tmp/foliokit-mobile-proof`). These are browser touch simulations, not physical-device testing.

Focused unit command, including save/export integrity, message origin/source checks, close cancellation and Android Back listener cleanup:

```sh
npm test -- src/__tests__/components/tools/PDFReaderTool.test.tsx src/__tests__/components/android/AndroidIntlProvider.test.tsx src/__tests__/lib/android-bridge.test.ts src/__tests__/lib/android-packaging.test.ts src/__tests__/lib/tauri-bridge.test.ts
npx tsc --noEmit
```

The signed 0.1.3 preview uses versionCode 4 and the existing FolioKit distribution key, allowing an in-place update from the signed 0.1.2 preview. The diagnostic helper pinned to the old 0.1.2 checksum is not an installer/validator for this new release; use the new release's checksums and ZIP transport.

Published Android workflows now attach a verified ZIP containing the same APK and include its hash in SHA256SUMS.txt. Use that ZIP if direct APK transfer fails integrity checks. `scripts/android-release-zip.py` verifies the APK against the existing release checksum before packaging, checks ZIP CRC and rechecks the archived APK SHA-256. The source-build workflow also runs the touch regression suite against its actual exported Android frontend.
