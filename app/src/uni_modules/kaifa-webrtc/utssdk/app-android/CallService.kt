package uts.sdk.modules.kaifaWebrtc

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder

/**
 * 通话前台服务：Android 10+ 后台麦克风需要前台服务；Android 14+ 需要 microphone 类型。
 * 由 KaifaWebRTC 在 ICE 连通后启动，hangup 时停止。
 */
class CallService : Service() {
    override fun onCreate() {
        super.onCreate()
        startForeground(NOTIFICATION_ID, buildNotification())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, buildNotification())
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun buildNotification(): Notification {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "通话",
                NotificationManager.IMPORTANCE_LOW
            )
            channel.description = "通话期间保持音频"
            manager.createNotificationChannel(channel)
        }
        val launch = packageManager.getLaunchIntentForPackage(packageName)
        val pending = if (launch != null) {
            PendingIntent.getActivity(this, 0, launch, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        } else null
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            Notification.Builder(this)
        }
        builder.setContentTitle("eu搭子通话中")
            .setContentText("正在通话，保持音频连接")
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setOngoing(true)
        if (pending != null) builder.setContentIntent(pending)
        return builder.build()
    }

    companion object {
        const val CHANNEL_ID = "kaifa_call"
        const val NOTIFICATION_ID = 41001

        fun start(context: Context) {
            val intent = Intent(context, CallService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            try { context.stopService(Intent(context, CallService::class.java)) } catch (e: Exception) {}
        }
    }
}
