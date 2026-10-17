# FolioKit

An open-source Android PDF toolkit adapted from [PDFCraft](https://github.com/PDFCraftTool/pdfcraft). Merge, split, organize, convert and annotate documents through a mobile application built with Capacitor, Next.js and WebAssembly.

[Download verified ZIP](https://github.com/dr-askar/FolioKit/releases/download/v0.1.3-preview/FolioKit-universal.zip) · [Direct APK](https://github.com/dr-askar/FolioKit/releases/download/v0.1.3-preview/FolioKit-universal.apk) · [Release details](https://github.com/dr-askar/FolioKit/releases/tag/v0.1.3-preview) · [Report a bug](https://github.com/dr-askar/FolioKit/issues/new/choose) · [Contribute](CONTRIBUTING.md) · [Build Android](ANDROID.md)

## Install

Download the release ZIP using your phone, extract it with the file manager, then open `FolioKit-universal.apk`. The direct APK download contains the same bytes. Allow installation from that browser/file manager when Android asks. Release previews are experimental; keep backups of important documents.

The signed 0.1.3 preview can update the signed 0.1.2 preview in place: it keeps the same distribution key and increases versionCode to 4. Release checksums are attached as `SHA256SUMS.txt`. The ZIP is checked for integrity and contains the unchanged signed APK, not a different application.

The universal APK has no CPU architecture restrictions. Android 6.0 (API 23) or newer and an updated Android System WebView are required. Device policies, available storage and WebView compatibility can still affect installation or operation. A universal APK cannot guarantee support for every phone.

The old [Install Check helper](https://github.com/dr-askar/FolioKit/releases/tag/install-check-v0.1.0) validates **only 0.1.2** and will reject newer releases. Install 0.1.3 directly from its extracted APK; do not use that helper for this update. [Diagnostic instructions and source](tools/install-check/README.md).

## What is included

- PDF merging, splitting, page organization, annotation and conversion tools inherited from PDFCraft.
- Android document selection and export through the system share interface.
- A phone-sized reader with compact touch controls, persistent annotation tools and separate color/width settings.
- All 17 interface languages, including English and Arabic.
- Bundled PDF/Office WebAssembly engines and open-source license notices.

Core document tools process files locally. Office/WASM conversions remain experimental on Android, and not every inherited tool has been validated on physical devices. Check [known limitations and verification details](ANDROID.md) before relying on a workflow.

The complete package includes large Office and Python/PDF engines. The signed 0.1.3 preview is **203 MB (194.02 MiB)**, down from approximately 566 MiB in the first build. Ordinary installation and activity launch passed on fresh Android 6, 15 and 16 emulators; this does not verify every document tool or physical phone. See [0.1.3 validation](docs/android-v0.1.3-validation.md) and the attached size report; smaller downloads must not silently remove languages or engines.

## Reading and marking on phones

Open a PDF in the reader, then tap Highlight, Draw or Text on the bottom toolbar. Use Tool settings to choose a color or width and tap Done: the tool stays active with the settings closed. Highlight by moving your finger across text or a page margin. Select the hand icon (Read / scroll) to scroll with one finger; use two fingers to pinch zoom. Undo is on the bottom bar, and Redo is in More.

Save exports the marked PDF through Android's share sheet. Choose a destination and reopen the saved copy to confirm your work was saved. Android Back closes an expanded reader panel first; closing a changed document asks for confirmation. The smaller app header, two-column tool cards and collapsible reference material also leave more room on small screens. Touch checks cover narrow widths, landscape and Arabic/RTL; physical-device feedback and improvements to individual inherited tools are welcome.

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
