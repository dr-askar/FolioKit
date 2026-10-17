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

The new measured APK size and compressed component breakdown are attached to each release as `apk-report.json`. `scripts/android-apk-report.py` verifies all 17 locale files/routes, required raw engines, absence of duplicate Office gzip/chunks, legal notices, and clean-source metadata. It rejects APKs above a **300 MiB regression budget**. That is a guard against accidental duplication, not a promise that the app can be reduced below 100 MB while retaining every bundled engine.

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
3. Leave `release_tag` empty for a downloadable Actions artifact only. Set a new tag such as `v0.1.1-preview` to publish a GitHub prerelease after a successful build. The job needs repository Contents write permission only for publishing.
4. The release includes the APK, exact corresponding source archive, `REVISION.txt`, `SHA256SUMS.txt`, `apk-report.json`, legal notices and these build instructions. Never move an existing release tag onto different source or upload an APK built from another revision under it.
5. A locally built preview may also be uploaded with `gh release create`, using an exact commit/tag and `--prerelease`. Always upload its matching source archive and checksums in the same release. Use a notes file with `--notes-file`.

Debug builds use a debug signing key. Different build machines can produce differently signed APKs, so Android may require uninstalling an older preview before installing a newer one; uninstalling clears app-local data. Use your own securely stored signing key for stable updates. Do not commit keys or passwords. This project has not been submitted to Google Play.

## Project provenance and validation

FolioKit repository: https://github.com/dr-askar/FolioKit. Original project: https://github.com/PDFCraftTool/pdfcraft. Android contributor: Mohammad Askar (dr-askar). All derivative code remains AGPL-3.0; inherited notices remain intact. Original desktop/web/Docker publishing workflows are restricted to the upstream repository so pushing this Android project does not automatically publish unrelated products.

Automated build checks are not a physical-device test or a completed legal audit. The 230 npm package notices are included, but bundled WASM/Python wheels/fonts and native transitive dependencies still need a full license/source-availability review before treating this as production distribution. Known device-testing requirements are listed above. A successful APK signature check proves package integrity, not tool correctness on every WebView.
