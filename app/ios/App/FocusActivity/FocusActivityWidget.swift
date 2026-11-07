import ActivityKit
import SwiftUI
import WidgetKit

/// Fixed dark "ink" palette of the default pixel theme (tokens.ts: ink-950 / ink-50 / purple-250).
/// The activity does not follow the in-app theme.
private enum Palette {
    static let background = Color(red: 0x12 / 255, green: 0x15 / 255, blue: 0x1C / 255)
    static let text = Color(red: 0xE8 / 255, green: 0xEB / 255, blue: 0xF4 / 255)
    static let textSecondary = Color(red: 0x9D / 255, green: 0xA3 / 255, blue: 0xB4 / 255)
    static let accent = Color(red: 0xA7 / 255, green: 0x8B / 255, blue: 0xFA / 255)
    static let breakAccent = Color(red: 0x43 / 255, green: 0xCB / 255, blue: 0xEA / 255)
}

/// Handjet (bundled TTF, registered via UIAppFonts). Handjet's glyphs run small, so sizes are
/// scaled up ~15% like `size-adjust` does on the web (fonts.css).
private func pixelFont(_ size: CGFloat) -> Font {
    .custom("Handjet-Regular", fixedSize: size * 1.15)
}

@available(iOS 16.2, *)
private struct TimerText: View {
    let state: FocusActivityAttributes.ContentState
    let size: CGFloat

    var body: some View {
        Group {
            if state.isPaused {
                Text(format(state.remainingSeconds))
            } else {
                // Counts down on its own from the system clock.
                Text(timerInterval: Date.now...max(state.endDate, Date.now), countsDown: true)
            }
        }
        .font(pixelFont(size))
        .monospacedDigit()
        .multilineTextAlignment(.trailing)
        .foregroundStyle(Palette.text)
    }

    private func format(_ seconds: Int) -> String {
        String(format: "%02d:%02d", max(seconds, 0) / 60, max(seconds, 0) % 60)
    }
}

@available(iOS 16.2, *)
private func accent(for mode: String) -> Color {
    mode == "break" ? Palette.breakAccent : Palette.accent
}

@available(iOS 16.2, *)
private struct LockScreenView: View {
    let attributes: FocusActivityAttributes
    let state: FocusActivityAttributes.ContentState

    var body: some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 2) {
                Text("PIXDONE")
                    .font(pixelFont(14))
                    .foregroundStyle(accent(for: attributes.mode))
                Text(state.isPaused ? "\(attributes.label) ⏸" : attributes.label)
                    .font(pixelFont(16))
                    .foregroundStyle(Palette.textSecondary)
            }
            Spacer()
            TimerText(state: state, size: 40)
        }
        .padding(16)
        .activityBackgroundTint(Palette.background)
        .activitySystemActionForegroundColor(Palette.text)
        .widgetURL(URL(string: "pixdone://focus"))
    }
}

@available(iOS 16.2, *)
struct FocusActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: FocusActivityAttributes.self) { context in
            LockScreenView(attributes: context.attributes, state: context.state)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Text(context.state.isPaused ? "\(context.attributes.label) ⏸" : context.attributes.label)
                        .font(pixelFont(16))
                        .foregroundStyle(accent(for: context.attributes.mode))
                }
                DynamicIslandExpandedRegion(.trailing) {
                    TimerText(state: context.state, size: 32)
                }
            } compactLeading: {
                Text(context.attributes.mode == "break" ? "☕︎" : "●")
                    .font(pixelFont(14))
                    .foregroundStyle(accent(for: context.attributes.mode))
            } compactTrailing: {
                TimerText(state: context.state, size: 14)
                    .frame(maxWidth: 52)
            } minimal: {
                Text(context.attributes.mode == "break" ? "☕︎" : "●")
                    .font(pixelFont(14))
                    .foregroundStyle(accent(for: context.attributes.mode))
            }
            .widgetURL(URL(string: "pixdone://focus"))
            .keylineTint(accent(for: context.attributes.mode))
        }
    }
}
