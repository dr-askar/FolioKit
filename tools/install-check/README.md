# FolioKit Install Check

A small native Android diagnostic helper for the generic “App not installed” dialog on a physical phone. It is separate from the PDF toolkit and does not claim to fix the underlying cause.

1. Install and open `FolioKit-install-check.apk`.
2. Choose the downloaded **FolioKit-universal.apk 0.1.2** using the first button. The helper checks its exact size, SHA-256 and package name locally. A different release is rejected.
3. Tap Install, approve this installation source in Android settings if requested, return and tap Install again. Android still requires user confirmation.
4. After the attempt, return to the helper and copy the report. It includes Android API/version, free internal storage, file integrity, the PackageInstaller status and any underlying install error Android supplies. Some OEMs may still return limited detail. It does not collect the phone model or upload anything.

The selected APK is copied to app-private storage for verification; allow room for that copy and Android's installation staging. Uninstalling the helper removes its copy and report. Do not disable Play Protect or device security policies. This helper cannot diagnose a device that refuses to install the helper itself; that case still needs Android's own installation logs.

## Build

No third-party libraries, Gradle or network requests are required. Use JDK 21, Android platform 35 and build-tools 35.0.0. Provide the private signing environment variables as for the main app, then run:

```sh
bash tools/install-check/build.sh
```

Output: `tools/install-check/build/FolioKit-install-check.apk`. Android 6/API 23 minimum; target API 35; no native ABI restrictions. It has no internet or broad storage permission. `REQUEST_INSTALL_PACKAGES` is used solely to request installation of the explicitly selected, checksum-verified FolioKit release. It cannot install silently. The package is `io.github.draskar.foliokit.installcheck` and does not overwrite FolioKit.

AGPL-3.0, like the parent repository. Preserve the parent LICENSE and contributor notices when redistributing. Never bundle private signing files.
