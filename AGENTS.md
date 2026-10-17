# FolioKit project instructions

## Scope and attribution

FolioKit is an independent Android adaptation of PDFCraft. Preserve the AGPL-3.0 LICENSE, original copyright notices, upstream links/acknowledgments, and Mohammad Askar (dr-askar) as the Android contributor. Keep personal names out of the application product name. Do not claim upstream endorsement. Read ANDROID.md before changing Android packaging or publishing builds.

## Android implementation

- Keep desktop/web behavior intact. Android branding and shared-message loading are conditional on ANDROID_BUILD.
- Use the existing Capacitor bridge for Android exports. Do not add document upload services or silent remote engine downloads.
- All 17 languages and required PDF/Office engines remain bundled. Do not remove features/languages merely to meet a size target without documenting and agreeing on that product change.
- Use `npm run android:debug`; see ANDROID.md for the build pipeline. Android preparation deliberately skips website Cloudflare chunking and removes only duplicate gzip Office assets after checking the raw assets exist.
- Generated assets, build outputs, Android local.properties and signing secrets must stay untracked.

## Verification

Run the focused Android tests documented in ANDROID.md for translation/export/packaging changes, plus TypeScript checking. Build the APK for packaging/native changes. Run `scripts/android-apk-report.py` against distributable APKs; inspect the report and signature. The report enforces a 300 MiB regression budget, all 17 locale routes/message files, engine presence, legal notices and clean-source metadata. Test real devices for user-visible Android behavior; do not claim a device test when only build/unit checks ran.

## Publishing and documentation

Maintain ANDROID.md with build commands, known feature limits, measured size findings and release instructions. Record source revision, exact matching source archive, APK checksums, size report and legal notices with every prerelease. Publish debug previews explicitly as prereleases; do not claim production/store readiness. Preserve private signing keys outside git. See ANDROID.md for manual Actions release_tag publishing and local `gh release create` mechanics. Keep inherited desktop, Docker and hosting publication upstream-only.
