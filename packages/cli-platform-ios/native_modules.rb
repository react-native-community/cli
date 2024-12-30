def use_native_modules!(config = nil)
  Pod::UI.warn("Requiring '@react-native-community/cli-platform-ios/native_modules' in the Podfile is deprecated. Autolinking logic has moved to react-native package. Please follow the upgrade instructions at: https://react-native-community.github.io/upgrade-helper/.");
end
