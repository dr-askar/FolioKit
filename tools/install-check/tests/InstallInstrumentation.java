package io.github.draskar.foliokit.installcheck.tests;
import android.app.*;
import android.content.*;
import android.net.Uri;
import android.os.Bundle;
import android.widget.TextView;
import java.lang.reflect.*;

public class InstallInstrumentation extends Instrumentation {
    private String expected;
    private Activity activity;
    private String report() throws Exception {
        final String[] value={""};
        runOnMainSync(() -> {
            try {
                Field f=activity.getClass().getDeclaredField("report"); f.setAccessible(true);
                value[0]=((TextView)f.get(activity)).getText().toString();
            } catch(Exception e) { throw new RuntimeException(e); }
        });
        return value[0];
    }
    private void choose(String path) {
        getContext().grantUriPermission("io.github.draskar.foliokit.installcheck", Uri.parse("content://io.github.draskar.foliokit.installcheck.test.fixture/"+path), Intent.FLAG_GRANT_READ_URI_PERMISSION);
        runOnMainSync(() -> {
            try {
                Method m=activity.getClass().getDeclaredMethod("onActivityResult",int.class,int.class,Intent.class); m.setAccessible(true);
                m.invoke(activity,1,Activity.RESULT_OK,new Intent().setData(Uri.parse("content://io.github.draskar.foliokit.installcheck.test.fixture/"+path)));
            } catch(Exception e) { throw new RuntimeException(e); }
        });
    }
    private void waitFor(String needle,int seconds) throws Exception {
        for(int i=0;i<seconds;i++) { if(report().contains(needle)) return; Thread.sleep(1000); }
        throw new AssertionError("Missing "+needle+"; report: "+report());
    }
    @Override public void onCreate(Bundle args) { super.onCreate(args); expected=args.getString("expected","SUCCESS"); start(); }
    @Override public void onStart() {
        Bundle result=new Bundle();
        try {
            Intent start=new Intent().setClassName(getTargetContext(),"io.github.draskar.foliokit.installcheck.MainActivity").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            activity=startActivitySync(start);
            choose("bad"); waitFor("DOWNLOAD_MISMATCH",30);
            choose("official"); waitFor("Download verified.",90);
            runOnMainSync(() -> {
                try { Method m=activity.getClass().getDeclaredMethod("requestInstall"); m.setAccessible(true); m.invoke(activity); }
                catch(Exception e) { throw new RuntimeException(e); }
            });
            waitFor("Android result: "+expected+" (",120);
            result.putString("report",report());
            result.putString("installCheckPassed","true");
            finish(Activity.RESULT_OK,result);
        } catch(Throwable e) {
            result.putString("installCheckPassed","false"); result.putString("error",e.toString());
            finish(Activity.RESULT_CANCELED,result);
        }
    }
}
