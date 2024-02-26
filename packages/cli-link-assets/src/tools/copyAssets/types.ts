type CopyAssetsOptions = {
  platformPath: string;
};

type AndroidCopyAssetsOptions = CopyAssetsOptions & {
  platformAssetsPath: string;
  shouldUseFontXMLFiles: boolean;
  isResourceFile: boolean;
};

type IOSCopyAssetsOptions = CopyAssetsOptions & {
  pbxprojFilePath: string;
  isFontAsset: boolean;
};

type CopyAssets = (
  assetFiles: string[],
  options: AndroidCopyAssetsOptions | IOSCopyAssetsOptions,
) => void;

export {CopyAssets, AndroidCopyAssetsOptions, IOSCopyAssetsOptions};
