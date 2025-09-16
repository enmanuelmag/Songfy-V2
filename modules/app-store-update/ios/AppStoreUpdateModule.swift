import ExpoModulesCore
import StoreKit

public class AppStoreUpdateModule: Module {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('AppStoreUpdate')` in JavaScript.
    Name("AppStoreUpdate")
    
    // Sets constant properties on the module. Can take a dictionary or a closure that returns a dictionary.
    Constants([
      "AppURL": "https://apps.apple.com/us/app/budget-fy/id6504546498",
      "ProductID": 6504546498
    ])

    AsyncFunction("openAppStore") { (identifier: Int, resolver: Promise) in
      let storeViewController = SKStoreProductViewController()
      //storeViewController.delegate = self

      let parameters = [SKStoreProductParameterITunesItemIdentifier: identifier]
      storeViewController.loadProduct(withParameters: parameters) { _, error in
        if error != nil {
          let url = URL(string: "https://apps.apple.com/us/app/budget-fy/id6504546498")
          if let url {
            UIApplication.shared.open(url)
            resolver.resolve(nil)
          } else {
            resolver.reject(AppStoreException("Invalid app URL or product ID"))
          }
        } else {
          //UIApplication.shared.windows.last?.present(storeViewController, animated: true)
          let keyWinwdo = UIApplication
            .shared
            .connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .last { $0.isKeyWindow }
          
          keyWinwdo?.rootViewController?.present(storeViewController, animated: true)
          resolver.resolve(nil)
        }
      }
    }
  }
}