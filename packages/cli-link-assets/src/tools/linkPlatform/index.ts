import {logger} from '@react-native-community/cli-tools';
import fs from 'fs';
import path from 'path';
import sha1File from '../../sha1File';
import {CleanAssets} from '../cleanAssets/types';
import {CopyAssets} from '../copyAssets/types';
import {AssetPathAndSHA1, Manifest} from '../manifest';

type AndroidPlatformConfig = {};

type iOSPlatformConfig = {
  pbxprojFilePath: string | null;
};

type PlatformConfig = (AndroidPlatformConfig | iOSPlatformConfig) & {
  exists: boolean;
  path: string;
};

type LinkOptionAndroidConfig = {
  path: string;
  useFontXMLFiles: boolean;
};

type LinkOptionIOSConfig = {
  addFont: boolean;
};

type LinkOptions = {
  android: LinkOptionAndroidConfig;
  ios: LinkOptionIOSConfig;
};

type Extensions = 'otf' | 'ttf' | 'png' | 'jpg' | 'gif' | 'mp3';

type LinkOptionsPerExt = {
  [ext in Extensions]?: LinkOptions;
};

type LinkPlatformOptionsPerExt = {
  [ext in Extensions]?: LinkOptionAndroidConfig | LinkOptionIOSConfig;
};

type LinkPlatformOptions = {
  name: string;
  enabled: boolean;
  platform: 'android' | 'ios';
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

const uniqWith = <T>(arr: T[], fn: (a: T, b: T) => boolean) => {
  return arr.filter(
    (element, index) => arr.findIndex((step) => fn(element, step)) === index,
  );
};

const clearDuplicated = (assets: AssetPathAndSHA1[]) => {
  return uniqWith(
    assets,
    (a, b) => path.parse(a.path).base === path.parse(b.path).base,
  );
};

const filesToIgnore = ['.DS_Store', 'Thumbs.db'];
const filterFilesToIgnore = (asset: AssetPathAndSHA1) => {
  return filesToIgnore.indexOf(path.basename(asset.path)) === -1;
};

const getAbsolute = (filePath: string, dirPath: string) => {
  return path.isAbsolute(filePath) ? filePath : path.resolve(dirPath, filePath);
};
const getRelative = (filePath: string, dirPath: string) => {
  return path.isAbsolute(filePath)
    ? path.relative(dirPath, filePath)
    : filePath;
};

const filterAssetByAssetsWhichNotExists =
  (assets: AssetPathAndSHA1[], normalizeAbsolutePathsTo: string) =>
  (asset: AssetPathAndSHA1) => {
    const relativeFilePath = getRelative(asset.path, normalizeAbsolutePathsTo);

    return (
      assets
        .map((otherAsset) => {
          return {
            ...otherAsset,
            path: getRelative(otherAsset.path, normalizeAbsolutePathsTo),
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

// let showAndroidRelinkingWarning = false;

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
  let prevRelativeAssets: AssetPathAndSHA1[] = [];
  try {
    prevRelativeAssets = manifest.read().map((asset) => {
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

    const stats = fs.lstatSync(asset);
    if (stats.isDirectory()) {
      fs.readdirSync(asset)
        .map((file) => path.resolve(asset, file))
        .forEach(loadAsset);
    } else {
      const sha1 = sha1File(asset);
      assets = assets.concat({
        path: asset,
        sha1,
      });
    }
  };

  assetsPaths.forEach(loadAsset);

  assets = clearDuplicated(assets);

  const fileFilters: FileFilter[] = [];
  fileFilters
    .concat(
      Object.keys(linkOptionsPerExt).map(
        (fileExt): FileFilter => ({
          name: fileExt,
          filter: (asset) => path.extname(asset.path) === `.${fileExt}`,
          options: linkOptionsPerExt[fileExt as Extensions],
        }),
      ),
    )
    .concat({
      name: 'custom',
      filter: (asset) =>
        Object.keys(linkOptionsPerExt).indexOf(
          path.extname(asset.path).substr(1),
        ) === -1,
      options: otherLinkOptions,
    });

  for (const fileFilter of fileFilters) {
    const prevRelativeAssetsWithExt = prevRelativeAssets
      .filter(fileFilter.filter)
      .filter(filterAssetByAssetsWhichNotExists(assets, rootPath));

    const prevRelativeAndroidFontAssetsToRelink = prevRelativeAssets
      .filter(fileFilter.filter)
      .filter((asset) => asset.shouldRelinkAndroidFonts);

    const assetsWithExt = assets
      .filter(fileFilter.filter)
      .filter(filterAssetByAssetsWhichNotExists(prevRelativeAssets, rootPath))
      .filter(filterFilesToIgnore);

    if (prevRelativeAndroidFontAssetsToRelink.length > 0) {
      // showAndroidRelinkingWarning = true;

      logger.info(
        `Relinking old ${fileFilter.name} assets from ${name} project to use XML resources`,
      );
      cleanAssets(
        prevRelativeAndroidFontAssetsToRelink.map((asset) =>
          getAbsolute(asset.path, rootPath),
        ),
        platform === 'android'
          ? {
              platformPath: platformConfig.path,
              platformAssetsPath: (
                fileFilter.options as LinkOptionAndroidConfig
              ).path,
              android_useFontXMLFiles: false,
            }
          : {
              platformPath: platformConfig.path,
              ios_pbxprojFilePath: (platformConfig as iOSPlatformConfig)
                .pbxprojFilePath!,
              ios_addFont: (fileFilter.options as LinkOptionIOSConfig).addFont,
            },
      );

      copyAssets(
        prevRelativeAndroidFontAssetsToRelink
          .filter(
            (a) => !prevRelativeAssetsWithExt.some((b) => b.path === a.path),
          )
          .map(({path: assetPath}) => assetPath),
        platform === 'android'
          ? {
              platformPath: platformConfig.path,
              platformAssetsPath: (
                fileFilter.options as LinkOptionAndroidConfig
              ).path,
              android_useFontXMLFiles: (
                fileFilter.options as LinkOptionAndroidConfig
              ).useFontXMLFiles,
            }
          : {
              platformPath: platformConfig.path,
              ios_pbxprojFilePath: (platformConfig as iOSPlatformConfig)
                .pbxprojFilePath!,
              ios_addFont: (fileFilter.options as LinkOptionIOSConfig).addFont,
            },
      );
    }

    if (prevRelativeAssetsWithExt.length > 0) {
      logger.info(
        `Cleaning previously linked ${fileFilter.name} assets from ${name} project`,
      );
      cleanAssets(
        prevRelativeAssetsWithExt
          .filter(
            (a) =>
              !prevRelativeAndroidFontAssetsToRelink.some(
                (b) => b.path === a.path,
              ),
          )
          .map(({path: filePath}) => getAbsolute(filePath, rootPath)),
        platform === 'android'
          ? {
              platformPath: platformConfig.path,
              platformAssetsPath: (
                fileFilter.options as LinkOptionAndroidConfig
              ).path,
              android_useFontXMLFiles: false,
            }
          : {
              platformPath: platformConfig.path,
              ios_pbxprojFilePath: (platformConfig as iOSPlatformConfig)
                .pbxprojFilePath!,
              ios_addFont: (fileFilter.options as LinkOptionIOSConfig).addFont,
            },
      );
    }

    if (assetsWithExt.length > 0) {
      logger.info(`Linking ${fileFilter.name} assets to ${name} project`);
      copyAssets(
        assetsWithExt.map(({path: assetPath}) => assetPath),
        platform === 'android'
          ? {
              platformPath: platformConfig.path,
              platformAssetsPath: (
                fileFilter.options as LinkOptionAndroidConfig
              ).path,
              android_useFontXMLFiles: (
                fileFilter.options as LinkOptionAndroidConfig
              ).useFontXMLFiles,
            }
          : {
              platformPath: platformConfig.path,
              ios_pbxprojFilePath: (platformConfig as iOSPlatformConfig)
                .pbxprojFilePath!,
              ios_addFont: (fileFilter.options as LinkOptionIOSConfig).addFont,
            },
      );
    }
  }
}

export default linkPlatform;
export {
  LinkOptionAndroidConfig,
  LinkOptionIOSConfig,
  LinkOptions,
  LinkOptionsPerExt,
  LinkPlatformOptions,
};
