import UIKit
import Capacitor

/// Registers the app-local plugins that are not published as packages.
/// (SceneDelegate creates this as the root view controller.)
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(FocusServicePlugin())
    }
}
