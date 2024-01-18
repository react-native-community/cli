type CopyAssetsOptions = {
  platformPath: string;
};

type AndroidCopyAssetsOptions = CopyAssetsOptions & {
  platformAssetsPath: string;
  useFontXMLFiles: boolean;
};

type IOSCopyAssetsOptions = CopyAssetsOptions & {
  pbxprojFilePath: string;
  addFont: boolean;
};

type CopyAssets = (
  assetFiles: string[],
  options: AndroidCopyAssetsOptions | IOSCopyAssetsOptions,
) => void;

export {CopyAssets, AndroidCopyAssetsOptions, IOSCopyAssetsOptions};
