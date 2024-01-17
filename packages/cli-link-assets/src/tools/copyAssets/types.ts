type CopyAssetsOptions = {
  platformPath: string;
};

type AndroidCopyAssetsOptions = CopyAssetsOptions & {
  platformAssetsPath: string;
  android_useFontXMLFiles: boolean;
};

type IOSCopyAssetsOptions = CopyAssetsOptions & {
  ios_pbxprojFilePath: string;
  ios_addFont: boolean;
};

type CopyAssets = (
  assetFiles: string[],
  options: AndroidCopyAssetsOptions | IOSCopyAssetsOptions,
) => void;

export {CopyAssets, AndroidCopyAssetsOptions, IOSCopyAssetsOptions};
