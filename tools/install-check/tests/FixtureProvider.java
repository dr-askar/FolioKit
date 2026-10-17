package io.github.draskar.foliokit.installcheck.tests;
import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import java.io.*;

// Installed only in the ephemeral emulator test APK, never in the public helper.
public class FixtureProvider extends ContentProvider {
    @Override public boolean onCreate() { return true; }
    @Override public String getType(Uri uri) { return "application/vnd.android.package-archive"; }
    @Override public Cursor query(Uri u,String[] p,String s,String[] a,String o) { return null; }
    @Override public Uri insert(Uri u,ContentValues v) { throw new UnsupportedOperationException(); }
    @Override public int delete(Uri u,String s,String[] a) { throw new UnsupportedOperationException(); }
    @Override public int update(Uri u,ContentValues v,String s,String[] a) { throw new UnsupportedOperationException(); }
    @Override public ParcelFileDescriptor openFile(Uri uri,String mode) throws FileNotFoundException {
        if (!"r".equals(mode)) throw new FileNotFoundException("Read only");
        try {
            ParcelFileDescriptor[] pipe=ParcelFileDescriptor.createPipe();
            new Thread(() -> {
                try (OutputStream out=new ParcelFileDescriptor.AutoCloseOutputStream(pipe[1])) {
                    if (uri.getPath().equals("/bad")) out.write("incomplete download".getBytes("UTF-8"));
                    else try (InputStream in=getContext().getAssets().open("FolioKit-universal.apk")) {
                        byte[] buf=new byte[65536]; int n;
                        while((n=in.read(buf))!=-1) out.write(buf,0,n);
                    }
                } catch(IOException ignored) {}
            }).start();
            return pipe[0];
        } catch(IOException e) { throw new FileNotFoundException(e.toString()); }
    }
}
