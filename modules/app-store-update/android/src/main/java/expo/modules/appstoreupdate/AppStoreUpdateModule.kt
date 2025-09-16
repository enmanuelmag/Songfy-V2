package expo.modules.appstoreupdate

import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AppStoreUpdateModule : Module() {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  override fun definition() = ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('AppStoreUpdate')` in JavaScript.
    Name("AppStoreUpdate")

    // Sets constant properties on the module. Can take a dictionary or a closure that returns a dictionary.
    Constants(
      "AppURL" to "https://apps.apple.com/us/app/budget-fy/id6504546498",
      "ProductID" to 6504546498
    )

    AsyncFunction("openAppStore") { identifier: Int, promise: Promise ->
      promise.resolve(identifier)
    }
  }
}