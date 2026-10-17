# Contributing to FolioKit

Thank you for helping improve FolioKit. English is the primary language for project documentation, issues and pull requests; translation contributions are welcome.

## Choose a contribution

Report reproducible bugs, test a release on your Android device, improve accessibility, translate messages, or submit a focused code change. Search existing issues first. For substantial changes, describe the proposal in an issue so implementation can be coordinated.

## Development

1. Fork the repository and create a branch for your change.
2. Run `npm ci` using Node.js 22.
3. Read [ANDROID.md](ANDROID.md) and [AGENTS.md](AGENTS.md) before changing Android packaging.
4. Keep changes focused and explain their user-visible effect.
5. Open a pull request with reproduction steps, validation results and relevant screenshots.

For Android translation, export or packaging changes, run:

```sh
npm test -- src/__tests__/components/tools/PagePreviewGrid.test.tsx src/__tests__/components/tools/PDFReaderTool.test.tsx src/__tests__/components/android/AndroidIntlProvider.test.tsx src/__tests__/lib/android-bridge.test.ts src/__tests__/lib/android-packaging.test.ts src/__tests__/lib/tauri-bridge.test.ts
npx tsc --noEmit
```

For mobile reader or layout work, also run `npm run test:mobile`; after `npm run android:sync`, run `FOLIOKIT_STATIC_DIR=out npm run test:mobile` to exercise the exported app and its Save button. See [the touch check setup](ANDROID.md#reproduce-touch-regression-checks) for Chromium installation, screenshots and test coverage. Keep tool settings separate from the selected annotation mode, preserve readable document space and verify saved annotations by reopening the output. Include narrow-phone, landscape and RTL evidence with UI changes.

Build an APK for native or packaging changes and run the APK report described in ANDROID.md. State exactly which devices/emulators and operations you tested. Emulator launch success does not establish that all PDF tools work on every device.

## Project expectations

Preserve upstream copyrights, AGPL notices, all 17 languages and contributor attribution. Do not commit generated builds, private documents, keystores, passwords or tokens. Do not silently replace bundled processing with remote document uploads. New dependencies must have compatible licenses.

Use synthetic or explicitly shareable documents for bug reports. Keep discussion respectful and constructive. Maintainers may request changes, decline proposals or remove abusive content. Review and response times depend on contributor availability.

## Credit and licensing

Your commits retain your authorship. Add an appropriate entry to CONTRIBUTORS.md when contributing a substantial change. Contributions must be compatible with the repository's AGPL-3.0 license; preserve any third-party notices. No assignment of your copyright is requested.
