package com.pixdone.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;

/**
 * Foreground service that keeps the app process (JS timer + Web Audio BGM) alive while the
 * focus timer runs in the background. Without it Android freezes the backgrounded app after
 * ~2 minutes and the timer/BGM appear to stop. Started/stopped from JS via {@link FocusServicePlugin}.
 *
 * The notification shows a native countdown (chronometer) to {@code endAt}, so it keeps
 * ticking even while the app itself is not running JS.
 */
public class FocusService extends Service {
    static final String CHANNEL_ID = "focus_timer";
    static final int NOTIFICATION_ID = 4101;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        createChannel();
        String title = stringExtra(intent, "title", "PixDone");
        String text = stringExtra(intent, "text", "");
        long endAt = intent != null ? intent.getLongExtra("endAt", 0L) : 0L;

        Intent open = new Intent(this, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pending = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(text)
            .setSmallIcon(R.drawable.ic_stat_focus)
            .setContentIntent(pending)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setCategory(NotificationCompat.CATEGORY_TRANSPORT);
        if (endAt > System.currentTimeMillis()) {
            builder.setWhen(endAt).setShowWhen(true).setUsesChronometer(true).setChronometerCountDown(true);
        }
        Notification notification = builder.build();

        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
        return START_NOT_STICKY;
    }

    /** The app was swiped away from recents: JS state is gone, so end the service too. */
    @Override
    public void onTaskRemoved(Intent rootIntent) {
        stopSelf();
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public void onDestroy() {
        stopForeground(STOP_FOREGROUND_REMOVE);
        super.onDestroy();
    }

    private static String stringExtra(Intent intent, String key, String fallback) {
        String v = intent != null ? intent.getStringExtra(key) : null;
        return v != null ? v : fallback;
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Focus timer", NotificationManager.IMPORTANCE_LOW);
            channel.setShowBadge(false);
            getSystemService(NotificationManager.class).createNotificationChannel(channel);
        }
    }
}
