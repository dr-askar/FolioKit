#!/usr/bin/env bash
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
out="$root/build/tests"
bt="$ANDROID_HOME/build-tools/35.0.0"
platform="$ANDROID_HOME/platforms/android-35/android.jar"
mkdir -p "$out/classes" "$out/dex" "$out/assets"
cp "${1:?Official FolioKit APK required}" "$out/assets/FolioKit-universal.apk"
# Disposable CI test credentials, unrelated to the distribution key.
"$JAVA_HOME/bin/keytool" -genkeypair -noprompt -keystore "$out/test.p12" -storepass android -keypass android -alias test -keyalg RSA -keysize 2048 -validity 30 -dname CN=EmulatorTest
"$bt/apksigner" sign --ks "$out/test.p12" --ks-key-alias test --ks-pass pass:android --out "$out/helper-test-signed.apk" "$root/build/FolioKit-install-check.apk"
"$JAVA_HOME/bin/javac" --release 8 -classpath "$platform" -d "$out/classes" "$root"/tests/*.java
"$JAVA_HOME/bin/jar" cf "$out/classes.jar" -C "$out/classes" .
"$bt/d8" --lib "$platform" --min-api 23 --output "$out/dex" "$out/classes.jar"
cat > "$out/AndroidManifest.xml" <<'XML'
<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="io.github.draskar.foliokit.installcheck.test">
<uses-sdk android:minSdkVersion="23" android:targetSdkVersion="35" />
<instrumentation android:name="io.github.draskar.foliokit.installcheck.tests.InstallInstrumentation" android:targetPackage="io.github.draskar.foliokit.installcheck" />
<application android:label="Emulator test fixtures"><provider android:name="io.github.draskar.foliokit.installcheck.tests.FixtureProvider" android:authorities="io.github.draskar.foliokit.installcheck.test.fixture" android:exported="true" android:grantUriPermissions="true" /></application>
</manifest>
XML
"$bt/aapt2" link -I "$platform" --manifest "$out/AndroidManifest.xml" -A "$out/assets" -o "$out/test-resources.apk"
python3 - "$out" <<'PY'
import sys,zipfile
from pathlib import Path
out=Path(sys.argv[1])
with zipfile.ZipFile(out/'test-resources.apk') as src, zipfile.ZipFile(out/'test-unsigned.apk','w',zipfile.ZIP_DEFLATED) as dest:
    for item in src.infolist(): dest.writestr(item,src.read(item.filename))
    dest.write(out/'dex/classes.dex','classes.dex')
PY
"$bt/zipalign" -P 16 -f 4 "$out/test-unsigned.apk" "$out/test-aligned.apk"
"$bt/apksigner" sign --ks "$out/test.p12" --ks-key-alias test --ks-pass pass:android --out "$out/tests.apk" "$out/test-aligned.apk"
cat > "$out/conflict.xml" <<'XML'
<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="io.github.draskar.foliokit" android:versionCode="1"><uses-sdk android:minSdkVersion="23" android:targetSdkVersion="35"/><application android:label="Conflict fixture" android:hasCode="false"/></manifest>
XML
"$bt/aapt2" link -I "$platform" --manifest "$out/conflict.xml" -o "$out/conflict-unsigned.apk"
"$bt/zipalign" -P 16 -f 4 "$out/conflict-unsigned.apk" "$out/conflict-aligned.apk"
"$bt/apksigner" sign --ks "$out/test.p12" --ks-key-alias test --ks-pass pass:android --out "$out/conflict.apk" "$out/conflict-aligned.apk"
