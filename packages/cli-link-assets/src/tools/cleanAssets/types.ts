type CleanAssetsOptions = {
  platformPath: string;
};

type AndroidCleanAssetsOptions = CleanAssetsOptions & {
  platformAssetsPath: string;
  shouldUseFontXMLFiles: boolean;
};

type IOSCleanAssetsOptions = CleanAssetsOptions & {
  pbxprojFilePath: string;
  isFontAsset: boolean;
};

type CleanAssets = (
  assetFiles: string[],
  options: AndroidCleanAssetsOptions | IOSCleanAssetsOptions,
) => void;

export {CleanAssets, AndroidCleanAssetsOptions, IOSCleanAssetsOptions};
