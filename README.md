# FolioKit

An open-source Android PDF toolkit adapted from [PDFCraft](https://github.com/PDFCraftTool/pdfcraft). Merge, split, organize, convert and annotate documents through a mobile application built with Capacitor, Next.js and WebAssembly.

[Download signed universal APK](https://github.com/dr-askar/FolioKit/releases/download/v0.1.2-preview/FolioKit-universal.apk) · [Release details](https://github.com/dr-askar/FolioKit/releases/tag/v0.1.2-preview) · [Report a bug](https://github.com/dr-askar/FolioKit/issues/new/choose) · [Contribute](CONTRIBUTING.md) · [Build Android](ANDROID.md)

## Install

Download the APK attached to a release using your phone. Allow installation from that browser when Android asks. Release previews are experimental; keep backups of important documents.

The universal APK has no CPU architecture restrictions. Android 6.0 (API 23) or newer and an updated Android System WebView are required. Device policies, available storage and WebView compatibility can still affect installation or operation. A universal APK cannot guarantee support for every phone.

## What is included

- PDF merging, splitting, page organization, annotation and conversion tools inherited from PDFCraft.
- Android document selection and export through the system share interface.
- All 17 interface languages, including English and Arabic.
- Bundled PDF/Office WebAssembly engines and open-source license notices.

Core document tools process files locally. Office/WASM conversions remain experimental on Android, and not every inherited tool has been validated on physical devices. Check [known limitations and verification details](ANDROID.md) before relying on a workflow.

The complete package includes large Office and Python/PDF engines. The signed 0.1.2 preview is **203 MB (193.93 MiB)**, down from approximately 566 MiB in the first build. Ordinary installation and activity launch passed on fresh Android 6, 15 and 16 emulators; this does not verify every document tool or physical phone. See the attached size report for each release; smaller downloads must not silently remove languages or engines.

## Build from source

Use Node.js 22, JDK 21 and the Android SDK. See [ANDROID.md](ANDROID.md) for SDK setup, platform requirements and signing.

```sh
npm ci
npm run android:debug
```

The debug APK is generated in `android/app/build/outputs/apk/debug/`. Signed distribution builds use `npm run android:release` with a private signing key. Keys and passwords never belong in this repository.

## Contributions welcome

Android developers, PDF/WASM specialists, translators, accessibility reviewers, designers and device testers are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md), browse [issues](https://github.com/dr-askar/FolioKit/issues), or suggest a clearly scoped improvement. Include your Android/WebView versions when reporting device problems. Never attach private documents or signing credentials.

Pull requests are reviewed before merging. Contributor credit follows the project history and [CONTRIBUTORS.md](CONTRIBUTORS.md); acceptance into upstream PDFCraft is decided by its maintainers.

## License and attribution

FolioKit is an independent Android adaptation of PDFCraft, distributed under [AGPL-3.0](LICENSE). Android adaptation: **Mohammad Askar ([dr-askar](https://github.com/dr-askar))**. The product name is FolioKit.

Original PDFCraft contributors retain their copyrights and credit. PDFCraft also acknowledges [BentoPDF](https://github.com/alam00000/bentopdf); see the [preserved upstream README](docs/UPSTREAM_README.md) and [contributors](CONTRIBUTORS.md). This project does not imply upstream endorsement.

Release assets include corresponding source, revision information, checksums and third-party notices. Redistributors must preserve license notices and meet the AGPL source obligations; attribution alone does not replace the license requirements.
