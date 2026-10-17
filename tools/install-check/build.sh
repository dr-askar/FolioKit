#!/usr/bin/env bash
set -euo pipefail
root=$(cd "$(dirname "$0")" && pwd)
: "${ANDROID_HOME:?Set ANDROID_HOME to an Android SDK with platform 35 and build-tools 35.0.0}"
: "${JAVA_HOME:?Set JAVA_HOME to a JDK}"
: "${ANDROID_SIGNING_KEYSTORE:?Private signing key path required}"
: "${ANDROID_SIGNING_PASSWORD:?Private signing password required}"
# Secrets are read by apksigner from the environment, never passed as literal arguments.
bt="$ANDROID_HOME/build-tools/35.0.0"
platform="$ANDROID_HOME/platforms/android-35/android.jar"
output="$root/build"
rm -rf "$output"
mkdir -p "$output/classes" "$output/dex"
"$JAVA_HOME/bin/javac" --release 8 -classpath "$platform" -d "$output/classes" "$root"/src/io/github/draskar/foliokit/installcheck/*.java
"$JAVA_HOME/bin/jar" cf "$output/classes.jar" -C "$output/classes" .
"$bt/d8" --lib "$platform" --min-api 23 --output "$output/dex" "$output/classes.jar"
"$bt/aapt2" link -I "$platform" --manifest "$root/AndroidManifest.xml" -o "$output/resources.apk" --min-sdk-version 23 --target-sdk-version 35
python3 - "$output" <<'PY'
import sys,zipfile
from pathlib import Path
out=Path(sys.argv[1])
with zipfile.ZipFile(out/'resources.apk') as src, zipfile.ZipFile(out/'unsigned.apk','w',zipfile.ZIP_DEFLATED) as dest:
    for item in src.infolist(): dest.writestr(item,src.read(item.filename))
    dest.write(out/'dex/classes.dex','classes.dex')
PY
"$bt/zipalign" -P 16 -f 4 "$output/unsigned.apk" "$output/aligned.apk"
"$bt/apksigner" sign --ks "$ANDROID_SIGNING_KEYSTORE" --ks-key-alias foliokit --ks-pass env:ANDROID_SIGNING_PASSWORD --key-pass env:ANDROID_SIGNING_PASSWORD --out "$output/FolioKit-install-check.apk" "$output/aligned.apk"
"$bt/apksigner" verify --verbose "$output/FolioKit-install-check.apk"
"$bt/zipalign" -c -P 16 4 "$output/FolioKit-install-check.apk"
