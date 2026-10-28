import Foundation
import Capacitor
import AVFoundation
import UserNotifications

/// iOS counterpart of the Android `FocusServicePlugin` (same JS API: start/stop/permissions).
///
/// iOS only keeps the app running in the background while audio is actually playing, so:
///  - `keepAlive` (BGM is playing): switch the audio session to `.playback` (+ mix with other
///    audio) so the WebView's Web Audio BGM, the JS timer and the end sound keep going.
///    Otherwise the session is left alone and the ringer/silent switch is respected.
///  - A local notification is scheduled for the end time, so the user is told even if iOS
///    suspended the app (BGM off). It is silent when `keepAlive` (the app plays its own chime).
@objc(FocusServicePlugin)
public class FocusServicePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "FocusServicePlugin"
    public let jsName = "FocusService"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
    ]

    private let endNotificationId = "pixdone.focus.end"

    @objc func start(_ call: CAPPluginCall) {
        let keepAlive = call.getBool("keepAlive") ?? false
        let endAtMs = call.getDouble("endAt") ?? 0
        let session = AVAudioSession.sharedInstance()

        if keepAlive {
            do {
                try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
                try session.setActive(true)
            } catch {
                CAPLog.print("[FocusService] audio session error: \(error)")
            }
        } else {
            resetAudioSession()
        }

        scheduleEndNotification(
            endAtMs: endAtMs,
            title: call.getString("endTitle") ?? "PixDone",
            body: call.getString("endText") ?? "",
            silent: keepAlive
        )
        call.resolve()
    }

    @objc func stop(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [endNotificationId])
        resetAudioSession()
        call.resolve()
    }

    @objc override public func checkPermissions(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            call.resolve(["notifications": Self.permissionState(settings.authorizationStatus)])
        }
    }

    @objc override public func requestPermissions(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { _, _ in
            UNUserNotificationCenter.current().getNotificationSettings { settings in
                call.resolve(["notifications": Self.permissionState(settings.authorizationStatus)])
            }
        }
    }

    private static func permissionState(_ status: UNAuthorizationStatus) -> String {
        switch status {
        case .notDetermined: return "prompt"
        case .denied: return "denied"
        default: return "granted" // authorized, provisional, ephemeral
        }
    }

    private func scheduleEndNotification(endAtMs: Double, title: String, body: String, silent: Bool) {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [endNotificationId])
        let interval = endAtMs / 1000 - Date().timeIntervalSince1970
        guard interval > 1 else { return }

        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = silent ? nil : .default
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: interval, repeats: false)
        center.add(UNNotificationRequest(identifier: endNotificationId, content: content, trigger: trigger))
    }

    /// Back to the app default (respects the silent switch, ends the playback session).
    private func resetAudioSession() {
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.soloAmbient)
        try? session.setActive(false, options: .notifyOthersOnDeactivation)
    }
}
