package io.github.draskar.foliokit.installcheck;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.content.pm.PackageInstaller;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.StatFs;
import android.provider.Settings;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.security.MessageDigest;
import java.util.Locale;

public class MainActivity extends Activity {
    static final String TARGET = "io.github.draskar.foliokit";
    static final String EXPECTED_SHA = "f246543f4c1baa0a13e1d53b21a266b0ae8c01d3ef9b0d84e26f2a7432659026";
    static final long EXPECTED_SIZE = 203354390L;
    private TextView report;
    private Button choose, install;
    private boolean verified;
    private boolean busy;
    private boolean arabic;
    private File selected;
    private String preparation = "";
    private final android.content.SharedPreferences.OnSharedPreferenceChangeListener resultListener = (prefs, key) -> { if (report != null) render(); };

    private String tr(String en, String ar) { return arabic ? ar : en; }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        arabic = Locale.getDefault().getLanguage().equals("ar");
        selected = new File(getFilesDir(), "selected.apk");
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        int padding = (int)(20 * getResources().getDisplayMetrics().density);
        layout.setPadding(padding, padding, padding, padding);
        TextView title = new TextView(this);
        title.setText("FolioKit Install Check");
        title.setTextSize(23);
        layout.addView(title);
        TextView explanation = new TextView(this);
        explanation.setText(tr("Choose the downloaded FolioKit-universal.apk. This helper checks the download and asks Android to install it, then shows the exact result. Processing stays on this phone. Copy the report and send it to the maintainer yourself. This is a diagnostic helper, not the PDF toolkit.", "اختر ملف FolioKit-universal.apk الذي حمّلته. الأداة تفحص التحميل وتحاول تثبيته بموافقتك، ثم تعرض السبب الذي يعيده أندرويد. الفحص محلي على هاتفك. انسخ التقرير وأرسله بنفسك للمطوّر. هذه أداة فحص وليست برنامج PDF."));
        layout.addView(explanation);
        choose = new Button(this);
        choose.setText(tr("1. Choose FolioKit APK", "١. اختر ملف FolioKit APK"));
        choose.setOnClickListener(v -> {
            Intent picker = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            picker.setType("*/*");
            picker.addCategory(Intent.CATEGORY_OPENABLE);
            startActivityForResult(picker, 1);
        });
        layout.addView(choose);
        install = new Button(this);
        install.setText(tr("2. Install and show result", "٢. ثبّت واعرض النتيجة"));
        install.setEnabled(false);
        install.setOnClickListener(v -> requestInstall());
        layout.addView(install);
        Button copy = new Button(this);
        copy.setText(tr("3. Copy report", "٣. انسخ التقرير"));
        copy.setOnClickListener(v -> {
            ((ClipboardManager)getSystemService(CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("FolioKit installation report", report.getText()));
            android.widget.Toast.makeText(this, tr("Report copied", "تم نسخ التقرير"), android.widget.Toast.LENGTH_SHORT).show();
        });
        layout.addView(copy);
        report = new TextView(this);
        report.setTextIsSelectable(true);
        report.setTextSize(14);
        layout.addView(report);
        ScrollView scroll = new ScrollView(this);
        scroll.addView(layout);
        setContentView(scroll);
        if (state != null) preparation = state.getString("preparation", "");
        getSharedPreferences("result", MODE_PRIVATE).registerOnSharedPreferenceChangeListener(resultListener);
        render();
    }

    @Override public void onDestroy() {
        getSharedPreferences("result", MODE_PRIVATE).unregisterOnSharedPreferenceChangeListener(resultListener);
        super.onDestroy();
    }

    @Override public void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        out.putString("preparation", preparation);
        // After process recreation the file must be checked again before installation.
    }

    @Override public void onResume() { super.onResume(); if (report != null) render(); }

    private void render() {
        String last = getSharedPreferences("result", MODE_PRIVATE).getString("message", "");
        report.setText("Android " + Build.VERSION.RELEASE + " (API " + Build.VERSION.SDK_INT + ")\n"
            + "Free internal storage: " + new StatFs(getFilesDir().getPath()).getAvailableBytes() / 1048576 + " MiB\n"
            + "Expected APK: FolioKit 0.1.2, " + EXPECTED_SIZE + " bytes\n\n" + preparation + "\n\n" + last);
    }

    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request != 1 || result != RESULT_OK || data == null || data.getData() == null) return;
        verified = false;
        busy = true;
        install.setEnabled(false);
        choose.setEnabled(false);
        preparation = tr("Checking download…", "جارٍ فحص التحميل…");
        getSharedPreferences("result", MODE_PRIVATE).edit().clear().apply();
        render();
        final Uri uri = data.getData();
        new Thread(() -> {
            String outcome;
            try {
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                long count = 0;
                try (InputStream input = getContentResolver().openInputStream(uri);
                     OutputStream output = new FileOutputStream(selected)) {
                    if (input == null) throw new java.io.IOException("Cannot read the selected file");
                    byte[] buffer = new byte[65536];
                    int n;
                    while ((n = input.read(buffer)) != -1) {
                        count += n;
                        if (count > EXPECTED_SIZE) throw new java.io.IOException("Selected file is larger than this FolioKit release; choose FolioKit-universal.apk 0.1.2");
                        digest.update(buffer, 0, n);
                        output.write(buffer, 0, n);
                    }
                }
                StringBuilder hex = new StringBuilder();
                for (byte b : digest.digest()) hex.append(String.format(Locale.ROOT, "%02x", b & 255));
                String hash = hex.toString();
                outcome = "Selected bytes: " + count + "\nSHA-256: " + hash;
                if (count != EXPECTED_SIZE || !EXPECTED_SHA.equals(hash)) {
                    outcome += "\nDOWNLOAD_MISMATCH: file is incomplete, modified, or a different release. Download the official 0.1.2 universal APK again.";
                    selected.delete();
                } else {
                    PackageInfo info = getPackageManager().getPackageArchiveInfo(selected.getPath(), 0);
                    if (info == null || !TARGET.equals(info.packageName)) {
                        outcome += "\nPACKAGE_PARSE_FAILED: Android could not parse the verified official APK.";
                    } else {
                        verified = true;
                        outcome += "\nDownload verified. Package: " + info.packageName + ", version: " + info.versionName;
                    }
                }
            } catch (Exception e) {
                selected.delete();
                outcome = "FILE_CHECK_ERROR: " + e.getClass().getSimpleName() + ": " + e.getMessage();
            }
            final String message = outcome;
            runOnUiThread(() -> { busy = false; preparation = message; choose.setEnabled(true); install.setEnabled(verified); render(); });
        }).start();
    }

    private void requestInstall() {
        if (!verified || busy) return;
        if (Build.VERSION.SDK_INT >= 26 && !getPackageManager().canRequestPackageInstalls()) {
            preparation += "\n" + tr("Android requires permission for this helper to request installation. Allow this source, return here, then tap Install again.", "اسمح لهذه الأداة بطلب التثبيت، ثم ارجع واضغط زر التثبيت مجدداً.");
            render();
            try { startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getPackageName()))); }
            catch (Exception e) { preparation += "\nINSTALL_PERMISSION_ERROR: " + e.getMessage(); render(); }
            return;
        }
        busy = true;
        install.setEnabled(false);
        choose.setEnabled(false);
        getSharedPreferences("result", MODE_PRIVATE).edit().putString("message", "Preparing Android installation session…").commit();
        render();
        new Thread(() -> {
            PackageInstaller installer = getPackageManager().getPackageInstaller();
            int sessionId = -1;
            try {
                PackageInstaller.SessionParams params = new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
                params.setAppPackageName(TARGET);
                params.setSize(selected.length());
                if (Build.VERSION.SDK_INT >= 31) params.setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_REQUIRED);
                sessionId = installer.createSession(params);
                try (PackageInstaller.Session session = installer.openSession(sessionId)) {
                    try (InputStream input = new FileInputStream(selected);
                         OutputStream output = session.openWrite("base.apk", 0, selected.length())) {
                        byte[] buffer = new byte[65536];
                        int n;
                        while ((n = input.read(buffer)) != -1) output.write(buffer, 0, n);
                        session.fsync(output);
                    }
                    Intent callback = new Intent(this, InstallResultReceiver.class).setAction(getPackageName() + ".INSTALL_RESULT");
                    int flags = PendingIntent.FLAG_UPDATE_CURRENT;
                    if (Build.VERSION.SDK_INT >= 31) flags |= PendingIntent.FLAG_MUTABLE;
                    PendingIntent pending = PendingIntent.getBroadcast(this, sessionId, callback, flags);
                    session.commit(pending.getIntentSender());
                }
            } catch (Exception e) {
                if (sessionId >= 0) { try { installer.abandonSession(sessionId); } catch (Exception ignored) {} }
                getSharedPreferences("result", MODE_PRIVATE).edit().putString("message", "SESSION_ERROR: " + e.getClass().getSimpleName() + ": " + e.getMessage()).commit();
            }
            runOnUiThread(() -> { busy = false; choose.setEnabled(true); install.setEnabled(verified); render(); });
        }).start();
    }
}
