package io.github.draskar.foliokit.installcheck;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInstaller;

public class InstallResultReceiver extends BroadcastReceiver {
    static String statusName(int status) {
        switch (status) {
            case PackageInstaller.STATUS_PENDING_USER_ACTION: return "PENDING_USER_ACTION";
            case PackageInstaller.STATUS_SUCCESS: return "SUCCESS";
            case PackageInstaller.STATUS_FAILURE: return "FAILURE";
            case PackageInstaller.STATUS_FAILURE_BLOCKED: return "FAILURE_BLOCKED";
            case PackageInstaller.STATUS_FAILURE_ABORTED: return "FAILURE_ABORTED";
            case PackageInstaller.STATUS_FAILURE_INVALID: return "FAILURE_INVALID";
            case PackageInstaller.STATUS_FAILURE_CONFLICT: return "FAILURE_CONFLICT";
            case PackageInstaller.STATUS_FAILURE_STORAGE: return "FAILURE_STORAGE";
            case PackageInstaller.STATUS_FAILURE_INCOMPATIBLE: return "FAILURE_INCOMPATIBLE";
            default: return "STATUS_" + status;
        }
    }

    @Override public void onReceive(Context context, Intent intent) {
        if (!intent.hasExtra(PackageInstaller.EXTRA_STATUS)) return;
        int status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE);
        String message = "Android result: " + statusName(status) + " (" + status + ")\n"
            + "Legacy install code: " + intent.getIntExtra("android.content.pm.extra.LEGACY_STATUS", Integer.MIN_VALUE) + "\n"
            + "Details: " + intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE);
        if (status == PackageInstaller.STATUS_PENDING_USER_ACTION) {
            Intent confirmation = intent.getParcelableExtra(Intent.EXTRA_INTENT);
            if (confirmation != null) {
                try { context.startActivity(confirmation.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); }
                catch (Exception e) { message += "\nCONFIRMATION_ERROR: " + e.getClass().getSimpleName() + ": " + e.getMessage(); }
            } else message += "\nCONFIRMATION_ERROR: Android did not provide a confirmation screen.";
        }
        context.getSharedPreferences("result", Context.MODE_PRIVATE).edit().putString("message", message).commit();
    }
}
