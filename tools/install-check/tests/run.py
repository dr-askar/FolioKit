"""Exercise malformed downloads and real PackageInstaller success/conflict on an emulator."""
import pathlib,subprocess,time,xml.etree.ElementTree as ET,re,sys
out=pathlib.Path('tools/install-check/build/tests')
logs=pathlib.Path('install-check-diagnostics');logs.mkdir(exist_ok=True)
def adb(*args,check=True):
    return subprocess.run(['adb',*args],capture_output=True,text=True,check=check).stdout
# The exact public APK must install normally before test-only re-signing for instrumentation.
adb('install','tools/install-check/build/FolioKit-install-check.apk')
adb('shell','am','start','-W','-n','io.github.draskar.foliokit.installcheck/.MainActivity')
adb('shell','pidof','io.github.draskar.foliokit.installcheck')
adb('uninstall','io.github.draskar.foliokit.installcheck')
adb('install',str(out/'helper-test-signed.apk'))
adb('install',str(out/'tests.apk'))
adb('shell','appops','set','io.github.draskar.foliokit.installcheck','REQUEST_INSTALL_PACKAGES','allow',check=False)
adb('shell','settings','put','secure','install_non_market_apps','1',check=False)
for expected in ('SUCCESS','FAILURE_CONFLICT'):
    adb('uninstall','io.github.draskar.foliokit',check=False)
    if expected=='FAILURE_CONFLICT': adb('install',str(out/'conflict.apk'))
    logfile=logs/(expected+'.txt')
    with logfile.open('w') as log:
        proc=subprocess.Popen(['adb','shell','am','instrument','-w','-e','expected',expected,'io.github.draskar.foliokit.installcheck.test/io.github.draskar.foliokit.installcheck.tests.InstallInstrumentation'],stdout=log,stderr=subprocess.STDOUT)
        deadline=time.monotonic()+240
        while proc.poll() is None and time.monotonic()<deadline:
            time.sleep(2)
            try:
                adb('shell','uiautomator','dump','/sdcard/install-check-test.xml')
                xml=adb('shell','cat','/sdcard/install-check-test.xml')
                (logs/(expected+'-ui.xml')).write_text(xml)
                for node in ET.fromstring(xml).iter('node'):
                    if node.get('text','').strip().lower() in ('install','update') and node.get('enabled')=='true':
                        numbers=list(map(int,re.findall(r'\d+',node.get('bounds',''))))
                        if len(numbers)==4: adb('shell','input','tap',str((numbers[0]+numbers[2])//2),str((numbers[1]+numbers[3])//2))
            except (ET.ParseError,subprocess.CalledProcessError): pass
        if proc.poll() is None:
            proc.terminate(); raise SystemExit('Instrumentation timed out: '+expected)
    result=logfile.read_text();print(result)
    if 'installCheckPassed=true' not in result:
        (logs/(expected+'-logcat.txt')).write_text(adb('logcat','-d'))
        (logs/(expected+'-activity.txt')).write_text(adb('shell','dumpsys','activity','activities'))
        raise AssertionError(result)
adb('logcat','-d') # Android runtime errors remain in normal emulator logs too.
print('Malformed download, real installation success, and signature-conflict reporting passed.')
