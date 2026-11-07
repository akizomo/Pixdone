import Foundation

#if canImport(ActivityKit)
import ActivityKit

/// Shared by the app (starts / updates / ends the activity) and the FocusActivity widget
/// extension (draws it). Add this file to BOTH targets.
@available(iOS 16.1, *)
public struct FocusActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        /// Wall-clock end of the running stretch. Used while `isPaused == false`; the system
        /// draws the countdown itself, so it keeps ticking while the app is frozen.
        public var endDate: Date
        /// Seconds left, frozen. Used while `isPaused == true`.
        public var remainingSeconds: Int
        public var isPaused: Bool

        public init(endDate: Date, remainingSeconds: Int, isPaused: Bool) {
            self.endDate = endDate
            self.remainingSeconds = remainingSeconds
            self.isPaused = isPaused
        }
    }

    /// "focus" or "break". Fixed for the life of the activity (a mode change = a new activity).
    public var mode: String
    /// Localized label shown next to the timer (e.g. "フォーカス中" / "Focusing").
    public var label: String

    public init(mode: String, label: String) {
        self.mode = mode
        self.label = label
    }
}
#endif
