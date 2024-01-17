type CleanAssetsOptions = {
  platformPath: string;
};

type AndroidCleanAssetsOptions = CleanAssetsOptions & {
  platformAssetsPath: string;
  android_useFontXMLFiles: boolean;
};

type IOSCleanAssetsOptions = CleanAssetsOptions & {
  ios_pbxprojFilePath: string;
  ios_addFont: boolean;
};

type CleanAssets = (
  assetFiles: string[],
  options: AndroidCleanAssetsOptions | IOSCleanAssetsOptions,
) => void;

export {CleanAssets, AndroidCleanAssetsOptions, IOSCleanAssetsOptions};
