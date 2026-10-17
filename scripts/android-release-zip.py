"""Create an alternate phone download containing the unchanged, checksum-verified APK."""
import hashlib
import sys
import zipfile
from pathlib import Path

folder = Path(sys.argv[1])
apks = list(folder.glob('*.apk'))
assert len(apks) == 1, 'Expected one distributable APK'
apk = apks[0]

def digest(file):
    result = hashlib.sha256()
    with file.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            result.update(block)
    return result.hexdigest()

checksums = folder / 'SHA256SUMS.txt'
lines = checksums.read_text().splitlines()
expected = next(line.split()[0] for line in lines if line.split()[-1] == apk.name)
assert digest(apk) == expected, 'APK differs from the recorded release checksum'
archive = folder / (apk.stem + '.zip')
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_STORED) as bundle:
    bundle.write(apk, apk.name)
    bundle.writestr('SHA256SUMS.txt', f'{expected}  {apk.name}\n')
    bundle.writestr('README.txt', 'FolioKit Android preview. Extract this ZIP with your phone file manager and install the APK.\nThe APK is unchanged; this ZIP is an alternate transfer format, not another app version.\nThe old 0.1.2 Install Check helper is pinned to that old release and will reject newer releases.\nExact corresponding source, AGPL-3.0 license, contributor notices and build instructions accompany this release at https://github.com/dr-askar/FolioKit/releases\nAndroid adaptation: Mohammad Askar (dr-askar), based on PDFCraft.\n')
with zipfile.ZipFile(archive) as bundle:
    assert bundle.testzip() is None, 'ZIP integrity check failed'
    with bundle.open(apk.name) as stream:
        result = hashlib.sha256()
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            result.update(block)
        assert result.hexdigest() == expected, 'Archived APK was changed'
# Preserve the original APK/source hashes and append this transport hash once.
lines = [line for line in lines if line.split()[-1] != archive.name]
checksums.write_text('\n'.join(lines) + f'\n{digest(archive)}  {archive.name}\n')
print(f'Created {archive.name}: unchanged APK verified, ZIP CRC and SHA-256 recorded.')
