package com.pixdone.app;

import android.Manifest;
import android.content.Intent;
import androidx.core.content.ContextCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

/**
 * JS bridge for {@link FocusService}: start()/stop() the foreground service, plus the
 * Android 13+ notification permission (checkPermissions/requestPermissions, alias "notifications").
 * The service runs even if the permission is denied; the notification is just hidden.
 */
@CapacitorPlugin(
    name = "FocusService",
    permissions = { @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS }) }
)
public class FocusServicePlugin extends Plugin {
    @PluginMethod
    public void start(PluginCall call) {
        Intent intent = new Intent(getContext(), FocusService.class);
        intent.putExtra("title", call.getString("title", "PixDone"));
        intent.putExtra("text", call.getString("text", ""));
        intent.putExtra("endAt", call.getLong("endAt", 0L));
        ContextCompat.startForegroundService(getContext(), intent);
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getContext().stopService(new Intent(getContext(), FocusService.class));
        call.resolve();
    }
}
