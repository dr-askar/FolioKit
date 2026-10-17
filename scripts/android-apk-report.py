"""Inspect APK size and verify source, shared translations and required Office assets."""
import collections
import json
import sys
import zipfile
from pathlib import Path

apk = Path(sys.argv[1])
with zipfile.ZipFile(apk) as bundle:
    names = set(bundle.namelist())
    groups = collections.Counter()
    for item in bundle.infolist():
        name = item.filename.removeprefix('assets/public/')
        group = name.split('/')[0] if item.filename.startswith('assets/public/') else '(native)'
        groups[group] += item.compress_size
    for locale in ['en', 'ar', 'he', 'ja', 'ko', 'es', 'fr', 'de', 'zh', 'zh-TW', 'pt', 'it', 'id', 'vi', 'ro', 'pl', 'cs']:
        assert f'assets/public/android-messages/{locale}.json' in names, f'Missing locale {locale}'
        assert f'assets/public/{locale}/index.html' in names, f'Missing route {locale}'
    for name in ['soffice.wasm.bin', 'soffice.data.bin']:
        assert f'assets/public/libreoffice-wasm/{name}' in names, f'Missing Office engine {name}'
        assert f'assets/public/libreoffice-wasm/{name}.gz' not in names, 'Duplicate Office engine'
    assert not any('/libreoffice-wasm/' in name and '.part_' in name for name in names), 'Unexpected Cloudflare chunks'
    metadata = json.loads(bundle.read('assets/public/source-info.json'))
    assert metadata['modified'] is False, 'Build contains uncommitted changes'
    assert 'Mohammad Askar' in bundle.read('assets/public/open-source.html').decode()
    assert 'GNU AFFERO GENERAL PUBLIC LICENSE' in bundle.read('assets/public/AGPL-3.0.txt').decode()
    report = dict(apk=apk.name, bytes=apk.stat().st_size, mib=round(apk.stat().st_size / 1048576, 2), source=metadata,
                  compressed_groups_mib={key: round(value / 1048576, 2) for key, value in groups.most_common()})
    print(json.dumps(report, indent=2))
    assert apk.stat().st_size < 300 * 1048576, 'APK exceeds the 300 MiB regression budget; inspect duplicate assets'
