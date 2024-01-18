type CleanAssetsOptions = {
  platformPath: string;
};

type AndroidCleanAssetsOptions = CleanAssetsOptions & {
  platformAssetsPath: string;
  useFontXMLFiles: boolean;
};

type IOSCleanAssetsOptions = CleanAssetsOptions & {
  pbxprojFilePath: string;
  addFont: boolean;
};

type CleanAssets = (
  assetFiles: string[],
  options: AndroidCleanAssetsOptions | IOSCleanAssetsOptions,
) => void;

export {CleanAssets, AndroidCleanAssetsOptions, IOSCleanAssetsOptions};
