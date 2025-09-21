import {CLIError, logger} from '@react-native-community/cli-tools';
import fs from 'fs';
import path from 'path';
import sha1File from '../../sha1File';
import {CleanAssets} from '../cleanAssets/types';
import {CopyAssets} from '../copyAssets/types';
import {AssetPathAndSHA1, Manifest} from '../manifest';

type Platform = 'android' | 'ios';

type AndroidPlatformConfig = {};

type iOSPlatformConfig = {
  pbxprojFilePath: string;
};

type PlatformConfig = (AndroidPlatformConfig | iOSPlatformConfig) & {
  exists: boolean;
  path: string;
};

type LinkOptionAndroidConfig = {
  path: string;
  shouldUseFontXMLFiles: boolean;
  isResourceFile: boolean;
};

type LinkOptionIOSConfig = {
  isFontAsset: boolean;
};

type LinkOptions = {
  android: LinkOptionAndroidConfig;
  ios: LinkOptionIOSConfig;
};

type Extension = 'otf' | 'ttf' | 'png' | 'jpg' | 'gif' | 'mp3';

type LinkOptionsPerExt = {
  [ext in Extension]?: LinkOptions;
};

type LinkPlatformOptionsPerExt = {
  [ext in Extension]?: LinkOptionAndroidConfig | LinkOptionIOSConfig;
};

type LinkPlatformOptions = {
  name: string;
  enabled: boolean;
  platform: Platform;
  rootPath: string;
  assetsPaths: string[];
  manifest: Manifest;
  platformConfig: PlatformConfig;
  cleanAssets: CleanAssets;
  copyAssets: CopyAssets;
  linkOptionsPerExt: LinkPlatformOptionsPerExt;
  otherLinkOptions: LinkOptionAndroidConfig | LinkOptionIOSConfig;
};

type FileFilter = {
  name: string;
  filter: (asset: AssetPathAndSHA1) => boolean;
  options?: LinkOptionAndroidConfig | LinkOptionIOSConfig;
};

function uniqWith<T>(arr: T[], fn: (a: T, b: T) => boolean) {
  return arr.filter(
    (element, index) => arr.findIndex((step) => fn(element, step)) === index,
  );
}

function clearDuplicated(assets: AssetPathAndSHA1[]) {
  return uniqWith(
    assets,
    (a, b) => path.parse(a.path).base === path.parse(b.path).base,
  );
}

const filesToIgnore = ['.DS_Store', 'Thumbs.db'];
function filterFilesToIgnore(asset: AssetPathAndSHA1) {
  return filesToIgnore.indexOf(path.basename(asset.path)) === -1;
}

function getAbsolute(filePath: string, dirPath: string) {
  return path.isAbsolute(filePath) ? filePath : path.resolve(dirPath, filePath);
}
function getRelative(filePath: string, dirPath: string) {
  return path.isAbsolute(filePath)
    ? path.relative(dirPath, filePath)
    : filePath;
}

const filterAssetByAssetsWhichNotExists =
  (assets: AssetPathAndSHA1[], rootPath: string) =>
  (asset: AssetPathAndSHA1) => {
    const relativeFilePath = getRelative(asset.path, rootPath);

    return (
      assets
        .map((otherAsset) => {
          return {
            ...otherAsset,
            path: getRelative(otherAsset.path, rootPath),
          };
        })
        .findIndex((otherAsset) => {
          return (
            relativeFilePath === otherAsset.path &&
            asset.sha1 === otherAsset.sha1
          );
        }) === -1
    );
  };

function linkPlatform({
  name,
  platform,
  rootPath,
  assetsPaths,
  manifest,
  platformConfig,
  cleanAssets,
  copyAssets,
  linkOptionsPerExt,
  otherLinkOptions,
}: LinkPlatformOptions) {
  let showAndroidRelinkingWarning = false;

  let previouslyLinkedAssets: AssetPathAndSHA1[] = [];
  try {
    previouslyLinkedAssets = manifest.read().map((asset) => {
      return {
        ...asset,
        path: asset.path.split('/').join(path.sep), // Convert path to whatever system this is
      };
    });
  } catch (e) {
    // ok, manifest not found meaning no need to clean
  }

  let assets: AssetPathAndSHA1[] = [];

  const loadAsset = (assetMightNotAbsolute: string) => {
    const asset = getAbsolute(assetMightNotAbsolute, rootPath);

    try {
      const stats = fs.lstatSync(asset);

      if (stats.isDirectory()) {
        fs.readdirSync(asset)
          .sort() // Ensure consistent ordering across platforms
          .map((file) => path.resolve(asset, file))
          .forEach(loadAsset);
      } else {
        const sha1 = sha1File(asset);
        assets = assets.concat({
          path: asset,
          sha1,
        });
      }
    } catch (e) {
      throw new CLIError(
        `Could not find "${asset}" asset or folder. Please make sure the asset or folder exists.`,
      );
    }
  };

  assetsPaths.forEach(loadAsset);

  assets = clearDuplicated(assets).filter(filterFilesToIgnore);

  const fileFilters = Object.keys(linkOptionsPerExt)
    .map((fileExt): FileFilter => {
      return {
        name: fileExt,
        filter: (asset) => path.extname(asset.path) === `.${fileExt}`,
        options: linkOptionsPerExt[fileExt as Extension],
      };
    })
    .concat({
      name: 'custom',
      filter: (asset) =>
        Object.keys(linkOptionsPerExt).indexOf(
          path.extname(asset.path).substring(1),
        ) === -1,
      options: otherLinkOptions,
    });

  for (const fileFilter of fileFilters) {
    const assetsToUnlink = previouslyLinkedAssets
      .filter(fileFilter.filter)
      .filter(filterAssetByAssetsWhichNotExists(assets, rootPath));

    const androidAssetsToRelink = previouslyLinkedAssets
      .filter(fileFilter.filter)
      .filter((asset) => asset.shouldRelinkAndroidFonts);

    const assetsToLink = assets
      .filter(fileFilter.filter)
      .filter(
        filterAssetByAssetsWhichNotExists(previouslyLinkedAssets, rootPath),
      );

    const platformPath = platformConfig.path;
    const androidAssetsPath =
      platform === 'android'
        ? (fileFilter.options as LinkOptionAndroidConfig).path
        : undefined;
    const shouldUseAndroidFontXMLFiles =
      platform === 'android'
        ? (fileFilter.options as LinkOptionAndroidConfig).shouldUseFontXMLFiles
        : undefined;
    const isAndroidResourceFile =
      platform === 'android'
        ? (fileFilter.options as LinkOptionAndroidConfig).isResourceFile
        : undefined;
    const iosPbxprojFilePath =
      platform === 'ios'
        ? (platformConfig as iOSPlatformConfig).pbxprojFilePath
        : undefined;
    const isIOSFontAsset =
      platform === 'ios'
        ? (fileFilter.options as LinkOptionIOSConfig).isFontAsset
        : undefined;

    if (androidAssetsToRelink.length > 0) {
      showAndroidRelinkingWarning = true;

      logger.info(
        `Relinking old ${fileFilter.name} assets from ${name} project to use XML resources`,
      );
      cleanAssets(
        androidAssetsToRelink.map((asset) => getAbsolute(asset.path, rootPath)),
        platform === 'android'
          ? {
              platformPath: platformPath,
              platformAssetsPath: androidAssetsPath!,
              shouldUseFontXMLFiles: false,
              isResourceFile: isAndroidResourceFile!,
            }
          : {
              platformPath: platformPath,
              pbxprojFilePath: iosPbxprojFilePath!,
              isFontAsset: isIOSFontAsset!,
            },
      );

      copyAssets(
        androidAssetsToRelink
          .filter(
            (androidAsset) =>
              !assetsToUnlink.some(
                (assetToUnlink) => assetToUnlink.path === androidAsset.path,
              ),
          )
          .map((asset) => getAbsolute(asset.path, rootPath)),
        platform === 'android'
          ? {
              platformPath: platformPath,
              platformAssetsPath: androidAssetsPath!,
              shouldUseFontXMLFiles: shouldUseAndroidFontXMLFiles!,
              isResourceFile: isAndroidResourceFile!,
            }
          : {
              platformPath: platformPath,
              pbxprojFilePath: iosPbxprojFilePath!,
              isFontAsset: isIOSFontAsset!,
            },
      );
    }

    if (assetsToUnlink.length > 0) {
      logger.info(
        `Cleaning previously linked ${fileFilter.name} assets from ${name} project`,
      );
      cleanAssets(
        assetsToUnlink
          .filter(
            (assetToUnlink) =>
              !androidAssetsToRelink.some(
                (androidAsset) => androidAsset.path === assetToUnlink.path,
              ),
          )
          .map((asset) => getAbsolute(asset.path, rootPath)),
        platform === 'android'
          ? {
              platformPath: platformPath,
              platformAssetsPath: androidAssetsPath!,
              shouldUseFontXMLFiles: shouldUseAndroidFontXMLFiles!,
              isResourceFile: isAndroidResourceFile!,
            }
          : {
              platformPath: platformPath,
              pbxprojFilePath: iosPbxprojFilePath!,
              isFontAsset: isIOSFontAsset!,
            },
      );
    }

    if (assetsToLink.length > 0) {
      logger.info(`Linking ${fileFilter.name} assets to ${name} project`);
      copyAssets(
        assetsToLink.map((asset) => asset.path),
        platform === 'android'
          ? {
              platformPath: platformPath,
              platformAssetsPath: androidAssetsPath!,
              shouldUseFontXMLFiles: shouldUseAndroidFontXMLFiles!,
              isResourceFile: isAndroidResourceFile!,
            }
          : {
              platformPath: platformPath,
              pbxprojFilePath: iosPbxprojFilePath!,
              isFontAsset: isIOSFontAsset!,
            },
      );
    }
  }

  manifest.write(
    assets
      .sort((a, b) => a.path.localeCompare(b.path)) // Ensure consistent ordering for snapshots
      .map((asset) => ({
        ...asset,
        path: path.relative(rootPath, asset.path).split(path.sep).join('/'), // Convert path to POSIX just for manifest
      })),
  ); // Make relative

  if (showAndroidRelinkingWarning) {
    logger.warn(
      "The old Android font assets were relinked in order to use XML resources. Please refer to this guide to update your application's code as well: https://github.com/callstack/react-native-asset#font-assets-linking-and-usage",
    );
  }
}

export default linkPlatform;
export {
  Platform,
  LinkOptionAndroidConfig,
  LinkOptionIOSConfig,
  LinkOptions,
  LinkOptionsPerExt,
  LinkPlatformOptions,
};
