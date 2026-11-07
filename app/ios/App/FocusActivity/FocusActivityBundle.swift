import SwiftUI
import WidgetKit

@main
struct FocusActivityBundle: WidgetBundle {
    var body: some Widget {
        if #available(iOS 16.2, *) {
            FocusActivityWidget()
        }
    }
}
