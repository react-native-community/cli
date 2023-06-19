/**
 *
 * @param output

  This function takes the output of the gradlew command and filters out the deprecation warning about setting the namespace in `AndroidManifest.xml`.

  For wider context, see https://github.com/react-native-community/discussions-and-proposals/issues/671#issuecomment-1597386954

  Warning:
  package="com.library" found in source AndroidManifest.xml: /Users/user/app/node_modules/library/android/src/main/AndroidManifest.xml.
  Setting the namespace via a source AndroidManifest.xml's package attribute is deprecated.

  Please instead set the namespace (or testNamespace) in the module's build.gradle file, as described here: https://developer.android.com/studio/build/configure-app-module#set-namespace

  This migration can be done automatically using the AGP Upgrade Assistant, please refer to https://developer.android.com/studio/build/agp-upgrade-assistant for more information.
 */

export const filterGradlewOutput = (output: string) => {
  const regex = new RegExp(
    /package="([^"]+)" found in source AndroidManifest\.xml:(.*?)Setting the namespace via a source AndroidManifest.xml's package attribute is deprecated\.(.*?)Please instead set the namespace \(or testNamespace\) in the module's build\.gradle file, as described here: https:\/\/developer\.android\.com\/studio\/build\/configure-app-module#set-namespace(.*?\n)*This migration can be done automatically using the AGP Upgrade Assistant, please refer to https:\/\/developer\.android\.com\/studio\/build\/agp-upgrade-assistant for more information\./gms,
  );

  if (!regex.test(output)) {
    console.log(output);
  }
};
