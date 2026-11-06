import Foundation
import Capacitor
import AVFoundation
import UserNotifications
import UIKit

/// iOS counterpart of the Android `FocusServicePlugin` (same JS API: start/stop/permissions).
///
/// iOS only keeps the app running in the background while audio is actually playing, so:
///  - `keepAlive` (BGM is playing): switch the audio session to `.playback` (+ mix with other
///    audio) so the native BGM keeps the app running in the background.
///    Otherwise the session is left alone and the ringer/silent switch is respected.
///  - A local notification is scheduled for the end time, so the user is told even if iOS
///    suspended the app (BGM off) or the WebView is frozen in the background (BGM on).
///
/// BGM is played natively (`playBgm` / `stopBgm`) from the pre-rendered loops in
/// `public/bgm/` (scripts/render-bgm.mjs): WebKit suspends Web Audio as soon as the app
/// leaves the foreground, whatever the audio session says. While a timer is running with
/// `keepAlive`, the BGM also stops by itself at `endAt`, since the frozen WebView can't.
@objc(FocusServicePlugin)
public class FocusServicePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "FocusServicePlugin"
    public let jsName = "FocusService"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "playBgm", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopBgm", returnType: CAPPluginReturnPromise),
    ]

    private let endNotificationId = "pixdone.focus.end"

    // BGM state — touched on the main queue only.
    private let engine = AVAudioEngine()
    private let player = AVAudioPlayerNode()
    private var bgmBuffer: AVAudioPCMBuffer?
    private var bgmTrack: String?
    private var bgmVolume: Float = 0
    /// True between playBgm and stopBgm, also while an interruption has paused the audio.
    private var bgmWanted = false
    private var bgmAutoStop: DispatchWorkItem?
    /// Plays the end chime natively: the frozen WebView can't, and the BGM would just cut out.
    private let chimePlayer = AVAudioPlayerNode()
    private var chimeKind = "focus"
    private var observersInstalled = false

    @objc func start(_ call: CAPPluginCall) {
        let keepAlive = call.getBool("keepAlive") ?? false
        let endAtMs = call.getDouble("endAt") ?? 0

        if keepAlive {
            do {
                try activatePlaybackSession()
            } catch {
                CAPLog.print("[FocusService] audio session error: \(error)")
            }
        }

        scheduleEndNotification(
            endAtMs: endAtMs,
            title: call.getString("endTitle") ?? "PixDone",
            body: call.getString("endText") ?? ""
        )
        DispatchQueue.main.async {
            if !keepAlive { self.resetAudioSession() }
            self.chimeKind = call.getString("endChime") ?? "focus"
            self.scheduleBgmAutoStop(endAtMs: keepAlive ? endAtMs : 0)
            call.resolve()
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [endNotificationId])
        DispatchQueue.main.async {
            // The timer stopped (paused / ended / left the focus flow): no BGM without a timer.
            self.stopBgmPlayback()
            self.resetAudioSession()
            call.resolve()
        }
    }

    // MARK: - BGM

    @objc func playBgm(_ call: CAPPluginCall) {
        guard let track = call.getString("track") else {
            call.reject("track is required")
            return
        }
        let volume = Float(call.getDouble("volume") ?? 0.06)
        DispatchQueue.main.async {
            do {
                try self.startBgm(track: track, volume: volume)
                call.resolve()
            } catch {
                CAPLog.print("[FocusService] BGM error: \(error)")
                call.reject("BGM failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func stopBgm(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.stopBgmPlayback()
            call.resolve()
        }
    }

    private func startBgm(track: String, volume: Float) throws {
        installObserversIfNeeded()
        if track != bgmTrack || bgmBuffer == nil {
            stopBgmPlayback()
            guard let url = Bundle.main.url(forResource: track, withExtension: "caf", subdirectory: "public/bgm") else {
                throw NSError(domain: "FocusService", code: 1, userInfo: [NSLocalizedDescriptionKey: "no BGM file for \(track)"])
            }
            let file = try AVAudioFile(forReading: url)
            guard let buffer = AVAudioPCMBuffer(pcmFormat: file.processingFormat, frameCapacity: AVAudioFrameCount(file.length)) else {
                throw NSError(domain: "FocusService", code: 2, userInfo: [NSLocalizedDescriptionKey: "cannot allocate BGM buffer"])
            }
            try file.read(into: buffer)
            bgmBuffer = buffer
            bgmTrack = track
        }
        bgmVolume = volume
        bgmWanted = true
        try activatePlaybackSession()
        try startEngine()
    }

    /// (Re)starts the engine and loops the decoded buffer — a PCM buffer loop is sample-exact.
    private func startEngine() throws {
        guard let buffer = bgmBuffer else { return }
        player.volume = bgmVolume
        if engine.isRunning && player.isPlaying { return }
        player.stop()
        engine.stop()
        if !engine.attachedNodes.contains(player) { engine.attach(player) }
        engine.connect(player, to: engine.mainMixerNode, format: buffer.format)
        engine.prepare()
        try engine.start()
        player.scheduleBuffer(buffer, at: nil, options: .loops)
        player.play()
    }

    private func stopBgmPlayback() {
        bgmWanted = false
        bgmAutoStop?.cancel()
        bgmAutoStop = nil
        player.stop()
        chimePlayer.stop()
        engine.stop()
    }

    /// The timer hit 0 while the app is in the background: swap the BGM for the end chime,
    /// then let the audio session go. (In the foreground the web app plays its own chime.)
    private func finishWithChime() {
        guard UIApplication.shared.applicationState != .active else {
            stopBgmPlayback()
            return
        }
        bgmWanted = false
        bgmAutoStop = nil
        player.stop()
        let buffer = makeChimeBuffer(kind: chimeKind)
        do {
            try activatePlaybackSession()
            if !engine.attachedNodes.contains(chimePlayer) { engine.attach(chimePlayer) }
            engine.connect(chimePlayer, to: engine.mainMixerNode, format: buffer.format)
            if !engine.isRunning {
                engine.prepare()
                try engine.start()
            }
            chimePlayer.scheduleBuffer(buffer, at: nil, options: [])
            chimePlayer.play()
        } catch {
            CAPLog.print("[FocusService] chime error: \(error)")
            stopBgmPlayback()
            resetAudioSession()
            return
        }
        let duration = Double(buffer.frameLength) / buffer.format.sampleRate
        DispatchQueue.main.asyncAfter(deadline: .now() + duration + 0.3) { [weak self] in
            guard let self = self, !self.bgmWanted else { return }
            self.chimePlayer.stop()
            self.engine.stop()
            self.resetAudioSession()
        }
    }

    /// Pixel-style square-wave chime, mirroring `focusPomodoroComplete` / `focusBreakComplete`
    /// in soundEngine.ts. (freq Hz, start s, duration s, gain)
    private func makeChimeBuffer(kind: String) -> AVAudioPCMBuffer {
        var notes: [(Double, Double, Double, Float)] = []
        if kind == "break" {
            for t in [0.0, 0.55] {
                notes += [(659, t, 0.08, 0.07), (784, t + 0.10, 0.10, 0.07), (988, t + 0.24, 0.14, 0.06)]
            }
            notes.append((784, 1.10, 0.28, 0.05))
        } else {
            for t in [0.0, 0.55] {
                notes += [(784, t, 0.08, 0.08), (988, t + 0.10, 0.08, 0.08),
                          (1175, t + 0.20, 0.10, 0.08), (1568, t + 0.34, 0.16, 0.08)]
            }
            notes += [(1175, 1.15, 0.55, 0.07), (1568, 1.15, 0.70, 0.06)]
        }
        let rate = 44100.0
        let total = (notes.map { $0.1 + $0.2 }.max() ?? 1) + 0.05
        let format = AVAudioFormat(standardFormatWithSampleRate: rate, channels: 1)!
        let frames = AVAudioFrameCount(total * rate)
        let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frames)!
        buffer.frameLength = frames
        let data = buffer.floatChannelData![0]
        for i in 0..<Int(frames) { data[i] = 0 }
        // Gains in the web version are tuned for a quiet UI; scale up for a background alert.
        let boost: Float = 3.0
        for (freq, start, dur, gain) in notes {
            let begin = Int(start * rate)
            let count = Int(dur * rate)
            for n in 0..<count where begin + n < Int(frames) {
                let t = Double(n) / rate
                let wave: Float = sin(2 * .pi * freq * t) >= 0 ? 1 : -1
                let attack = min(1, Float(t / 0.005))
                let release = min(1, Float((dur - t) / 0.03))
                data[begin + n] += wave * gain * boost * attack * max(0, release)
            }
        }
        return buffer
    }

    /// The WebView is frozen in the background, so it can't stop the BGM when the timer hits 0.
    private func scheduleBgmAutoStop(endAtMs: Double) {
        bgmAutoStop?.cancel()
        bgmAutoStop = nil
        let interval = endAtMs / 1000 - Date().timeIntervalSince1970
        guard interval > 0 else { return }
        let work = DispatchWorkItem { [weak self] in self?.finishWithChime() }
        bgmAutoStop = work
        DispatchQueue.main.asyncAfter(deadline: .now() + interval, execute: work)
    }

    private func installObserversIfNeeded() {
        guard !observersInstalled else { return }
        observersInstalled = true
        let center = NotificationCenter.default
        // A call / Siri / another app's audio interrupts the session; resume when it ends.
        center.addObserver(forName: AVAudioSession.interruptionNotification, object: nil, queue: .main) { [weak self] note in
            guard let self = self,
                  let raw = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
                  AVAudioSession.InterruptionType(rawValue: raw) == .ended,
                  self.bgmWanted else { return }
            try? self.activatePlaybackSession()
            self.player.stop()
            try? self.startEngine()
        }
        // Route changes (headphones, Bluetooth) stop the engine.
        center.addObserver(forName: .AVAudioEngineConfigurationChange, object: engine, queue: .main) { [weak self] _ in
            guard let self = self, self.bgmWanted else { return }
            self.player.stop()
            try? self.startEngine()
        }
    }

    private func activatePlaybackSession() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
        try session.setActive(true)
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

    private func scheduleEndNotification(endAtMs: Double, title: String, body: String) {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [endNotificationId])
        let interval = endAtMs / 1000 - Date().timeIntervalSince1970
        guard interval > 1 else { return }

        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        // Always audible: in the background the WebView can't play the end chime.
        // (In the foreground iOS doesn't present it, and the app plays its own chime.)
        content.sound = .default
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: interval, repeats: false)
        center.add(UNNotificationRequest(identifier: endNotificationId, content: content, trigger: trigger))
    }

    /// Back to the app default (respects the silent switch, ends the playback session).
    private func resetAudioSession() {
        guard !bgmWanted else { return }
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.soloAmbient)
        try? session.setActive(false, options: .notifyOthersOnDeactivation)
    }
}
