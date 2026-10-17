# Android adaptation

Independent Android adaptation of [PDFCraft](https://github.com/PDFCraftTool/pdfcraft), licensed under AGPL-3.0. Android adaptation contributor: **Mohammad Askar ([dr-askar](https://github.com/dr-askar))**. Changes began 2026-10-17. Original copyright and acknowledgment notices remain in place; this is not an official upstream release.

## Build

Use Node 22+, Java 21, Android Studio and the SDK versions specified in `android/variables.gradle`. Install the SDK and accept its licenses normally. Set `ANDROID_HOME` to the SDK directory or configure `android/local.properties` (never commit it).

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
- The Android CI workflow creates a debug APK and source archive together as an artifact. It does not publish a store release.

## Upstream contribution

The Android changes are additive; existing desktop Tauri configuration is retained. A pull request can propose this support upstream with Mohammad Askar credited for the Android contribution. Acceptance and upstream attribution policy belong to the maintainers; this fork cannot guarantee acceptance.
