# @react-native-community/cli-link-assets

This package is part of the [React Native CLI](../../README.md). It contains commands to link assets to your Android / iOS projects.

## Installation

```sh
yarn add @react-native-community/cli-link-assets
```

## Commands

### `link-assets`

Usage:

```sh
npx react-native link-assets
```

Links your assets to the Android / iOS projects. You must configure your `react.native.config.js` file to specify where your assets are located, e.g:

```js
module.exports = {
  // If you want to link assets to both platforms.
  assets: ['./assets/shared'],
  project: {
    android: {
      // If you want to link assets only to Android.
      assets: ['./assets/android'],
    },
    ios: {
      // If you want to link assets only to iOS.
      assets: ['./assets/ios'],
      automaticPodsInstallation: true,
    },
  },
};
```

### Android

For **Android**, it supports the linking of the following assets:

#### Fonts (OTF, TTF)

Font assets are linked in Android by using [XML resources](https://developer.android.com/develop/ui/views/text-and-emoji/fonts-in-xml). For instance, if you add the **Lato** font to your project, it will generate a `lato.xml` file in `android/app/src/main/res/font/` folder with all the font variants that you added. It will also add a method call in `MainApplication.kt` or `MainApplication.java` file in order to register the custom font during the app initialization. It will look something like this:

```kotlin
// other imports

import com.facebook.react.common.assets.ReactFontManager // <- imports ReactFontManager.

class MainApplication : Application(), ReactApplication {

  // other methods

  override fun onCreate() {
    super.onCreate()
    ReactFontManager.getInstance().addCustomFont(this, "Lato", R.font.lato) // <- registers the custom font.
    // ...
  }
}
```

In this case, `Lato` is what you have to set in the `fontFamily` style of your `Text` component. To select the font variant e.g. weight and style, use `fontWeight` and `fontStyle` styles respectively.

```jsx
<Text style={{ fontFamily: 'Lato', fontWeight: '700', fontStyle: 'italic' }}>Lato Bold Italic</Text>
```

> [!IMPORTANT]
> If you have already linked font assets in your Android project with [react-native-asset](https://github.com/unimonkiez/react-native-asset), when running this tool it will relink your fonts to use XML resources as described above. **This migration will allow you to use your fonts in the code the same way you would use it for iOS**. Please update your code to use `fontFamily`, `fontWeight` and `fontStyle` styles correctly.

#### Images (JPG, PNG, GIF)

Image assets are linked by copying them to `android/app/src/main/res/drawable/` folder. This can be useful in brownfield applications where you need to use assets in the native side.

#### Sounds (MP3)

Sound assets are linked by copying them to `android/app/src/main/res/raw/` folder. This can be useful if used together with [react-native-sound](https://github.com/zmxv/react-native-sound) or in brownfield applications where you need to use assets in the native side.

#### Others

Any other custom assets are linked by copying them to `android/app/src/main/assets/custom/` folder.

### iOS

For **iOS**, it supports the linking of the following assets:

#### Fonts (OTF, TTF)

Font assets are linked in iOS by editing `project.pbxproj` and `Info.plist` files. To use the font in your app, you can a combination of `fontFamily`, `fontWeight` and `fontStyle` styles in the same way you would use for Android. In case you didn't link your font assets in Android and you are not sure which value you have to set in `fontFamily` style, you can use `Font Book` app in your Mac to find out the correct value by looking the `Family Name` property.

#### Images (JPG, PNG, GIF)

Image assets are linked by editing `project.pbxproj` and adding them as Resources. This can be useful in brownfield applications where you need to use assets in the native side.

#### Sounds (MP3)

Image assets are linked by editing `project.pbxproj` and adding them as Resources. This can be useful if used together with [react-native-sound](https://github.com/zmxv/react-native-sound) or in brownfield applications where you need to use assets in the native side.

#### Others

Image assets are linked by editing `project.pbxproj` and adding them as Resources.

### Manifest files

In both platforms, linked assets are tracked using the `link-assets-manifest.json` files which are stored in both `android/` and `ios/` folders. **They are necessary to track which assets are currently linked, and if the tool needs to add new ones or remove old assets during linking process, so make sure to commit them!**
