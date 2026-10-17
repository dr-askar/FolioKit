#!/usr/bin/env bash
set -euo pipefail
apk=${1:?APK path required}
output=${2:?Output directory required}
mkdir -p "$output"
adb shell getprop ro.build.version.sdk > "$output/android-api.txt"
adb shell getprop ro.product.cpu.abilist > "$output/abis.txt"
# Do not use -t: this must install as an ordinary APK, not a test-only package.
adb install "$apk" 2>&1 | tee "$output/install-result.txt"
adb logcat -c
adb shell am start -W -n io.github.draskar.foliokit/.MainActivity > "$output/launch-result.txt"
for attempt in {1..10}; do
  if adb shell pidof io.github.draskar.foliokit > "$output/process.txt"; then break; fi
  sleep 2
done
sleep 5
adb shell pidof io.github.draskar.foliokit > "$output/process.txt"
adb logcat -d > "$output/logcat.txt"
adb shell dumpsys activity activities > "$output/activity.txt"
# Screen/UI capture is diagnostic, not a package-install pass/fail criterion.
adb exec-out screencap -p > "$output/screenshot.png" || true
if adb shell uiautomator dump /sdcard/foliokit-ui.xml > "$output/ui-dump-result.txt" 2>&1; then
  adb pull /sdcard/foliokit-ui.xml "$output/ui.xml" || true
fi
python3 - "$output" <<'PY'
import sys
from pathlib import Path
out = Path(sys.argv[1])
assert 'Success' in (out / 'install-result.txt').read_text(), 'Package manager did not confirm installation'
assert 'Status: ok' in (out / 'launch-result.txt').read_text(), 'Activity launch failed'
assert (out / 'process.txt').read_text().strip(), 'Application process exited after launch'
assert 'FATAL EXCEPTION' not in (out / 'logcat.txt').read_text(), 'Uncaught Android runtime crash'
print('Ordinary APK installation and activity launch passed.')
PY
