import Foundation
import Capacitor
import EventKit

/// Read-only access to the user's Reminders, for the one-time "import from Reminders" flow.
///
/// Never writes to Reminders. JS API (see `src/services/reminders.ts`):
///  - `checkPermissions()` / `requestPermissions()` → `{ reminders: 'granted' | 'denied' | 'prompt' }`
///  - `getLists()` → `{ lists: [{ id, title, incompleteCount }] }`
///  - `getItems({ listIds })` → `{ items: [{ listId, title, notes?, dueDate?, recurrence? }] }`
///
/// `dueDate` is a local `YYYY-MM-DD` (time is dropped). `recurrence` is reported only for a single
/// daily or weekly rule; the JS side decides how (or whether) to map it.
@objc(RemindersPlugin)
public class RemindersPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "RemindersPlugin"
    public let jsName = "Reminders"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "checkPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getLists", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getItems", returnType: CAPPluginReturnPromise),
    ]

    private let store = EKEventStore()

    // MARK: - Permissions

    private func permissionState() -> String {
        let status = EKEventStore.authorizationStatus(for: .reminder)
        if #available(iOS 17.0, *) {
            switch status {
            case .fullAccess: return "granted"
            case .notDetermined: return "prompt"
            default: return "denied" // denied, restricted, writeOnly (not used for reminders)
            }
        }
        switch status {
        case .authorized: return "granted"
        case .notDetermined: return "prompt"
        default: return "denied"
        }
    }

    @objc override public func checkPermissions(_ call: CAPPluginCall) {
        call.resolve(["reminders": permissionState()])
    }

    @objc override public func requestPermissions(_ call: CAPPluginCall) {
        let done: (Bool, Error?) -> Void = { [weak self] _, error in
            if let error = error {
                CAPLog.print("[Reminders] permission error: \(error)")
            }
            call.resolve(["reminders": self?.permissionState() ?? "denied"])
        }
        if #available(iOS 17.0, *) {
            store.requestFullAccessToReminders(completion: done)
        } else {
            store.requestAccess(to: .reminder, completion: done)
        }
    }

    private func requireAccess(_ call: CAPPluginCall) -> Bool {
        if permissionState() == "granted" { return true }
        call.reject("Reminders access not granted", "PERMISSION_DENIED")
        return false
    }

    // MARK: - Reading

    @objc func getLists(_ call: CAPPluginCall) {
        guard requireAccess(call) else { return }
        let calendars = store.calendars(for: .reminder)
        let predicate = store.predicateForIncompleteReminders(
            withDueDateStarting: nil, ending: nil, calendars: calendars)
        store.fetchReminders(matching: predicate) { reminders in
            var counts: [String: Int] = [:]
            for r in reminders ?? [] {
                counts[r.calendar.calendarIdentifier, default: 0] += 1
            }
            let lists = calendars.map { cal -> [String: Any] in
                [
                    "id": cal.calendarIdentifier,
                    "title": cal.title,
                    "incompleteCount": counts[cal.calendarIdentifier] ?? 0,
                ]
            }
            call.resolve(["lists": lists])
        }
    }

    @objc func getItems(_ call: CAPPluginCall) {
        guard requireAccess(call) else { return }
        let ids = Set(call.getArray("listIds", String.self) ?? [])
        let calendars = store.calendars(for: .reminder).filter { ids.contains($0.calendarIdentifier) }
        if calendars.isEmpty {
            call.resolve(["items": []])
            return
        }
        let predicate = store.predicateForIncompleteReminders(
            withDueDateStarting: nil, ending: nil, calendars: calendars)
        store.fetchReminders(matching: predicate) { [weak self] reminders in
            guard let self = self else { return }
            let sorted = (reminders ?? []).sorted {
                ($0.creationDate ?? .distantPast) < ($1.creationDate ?? .distantPast)
            }
            let items = sorted.map { self.serialize($0) }
            call.resolve(["items": items])
        }
    }

    private func serialize(_ r: EKReminder) -> [String: Any] {
        var item: [String: Any] = [
            "listId": r.calendar.calendarIdentifier,
            "title": r.title ?? "",
        ]
        if let notes = r.notes, !notes.isEmpty {
            item["notes"] = notes
        }
        if let comps = r.dueDateComponents,
           let year = comps.year, let month = comps.month, let day = comps.day {
            item["dueDate"] = String(format: "%04d-%02d-%02d", year, month, day)
        }
        if let rules = r.recurrenceRules, rules.count == 1, let rule = rules.first,
           rule.recurrenceEnd == nil {
            var rec: [String: Any] = ["interval": rule.interval]
            switch rule.frequency {
            case .daily: rec["frequency"] = "daily"
            case .weekly: rec["frequency"] = "weekly"
            case .monthly: rec["frequency"] = "monthly"
            case .yearly: rec["frequency"] = "yearly"
            @unknown default: rec["frequency"] = "other"
            }
            if let days = rule.daysOfTheWeek, !days.isEmpty {
                // EKWeekday: 1 = Sunday … 7 = Saturday → 0 = Sun … 6 = Sat
                rec["weekDays"] = days.map { $0.dayOfTheWeek.rawValue - 1 }
                rec["hasWeekNumbers"] = days.contains { $0.weekNumber != 0 }
            }
            item["recurrence"] = rec
        }
        return item
    }
}
