import {
  findPbxprojFile,
  findXcodeProject,
} from '@react-native-community/cli-platform-apple';
import {CLIError} from '@react-native-community/cli-tools';
import type {Config as CLIConfig} from '@react-native-community/cli-types';
import fs from 'fs';
import path from 'path';
import {audioTypes, fontTypes, imageTypes} from './fileTypes';
import cleanAndroidAssets from './tools/cleanAssets/android';
import cleanIOSAssets from './tools/cleanAssets/ios';
import copyAndroidAssets from './tools/copyAssets/android';
import copyIOSAssets from './tools/copyAssets/ios';
import linkPlatform, {
  LinkOptions,
  LinkOptionsPerExt,
  LinkPlatformOptions,
} from './tools/linkPlatform';
import getManifest from './tools/manifest';

function getLinkOptions(
  assetType: 'font' | 'image' | 'audio' | 'custom',
  androidPath: string,
  androidAppName: string,
): LinkOptions {
  const baseAndroidPath = [androidPath, androidAppName, 'src', 'main'];

  let shouldUseFontXMLFiles = false;
  let isFontAsset = false;
  switch (assetType) {
    case 'font': {
      baseAndroidPath.push('assets', 'fonts');
      shouldUseFontXMLFiles = true;
      isFontAsset = true;
      break;
    }

    case 'image': {
      baseAndroidPath.push('res', 'drawable');
      break;
    }

    case 'audio': {
      baseAndroidPath.push('res', 'raw');
      break;
    }

    case 'custom': {
      baseAndroidPath.push('assets', 'custom');
      break;
    }
  }

  return {
    android: {
      path: path.resolve(...baseAndroidPath),
      shouldUseFontXMLFiles,
    },
    ios: {
      isFontAsset,
    },
  };
}

async function linkAssets(_argv: string[], ctx: CLIConfig): Promise<void> {
  let androidPath: string = '';
  let androidAssetsPath: string[] = ctx.assets;
  let androidAppName: string = '';
  if (ctx.project.android) {
    androidPath = ctx.project.android.sourceDir;
    androidAssetsPath = androidAssetsPath.concat(ctx.project.android.assets);
    androidAppName = ctx.project.android.appName;
  }

  let iosPath: string = '';
  let iosAssetsPath: string[] = ctx.assets;
  let iosPbxprojFilePath: string | null = null;
  if (ctx.project.ios) {
    iosPath = ctx.project.ios.sourceDir;
    iosAssetsPath = iosAssetsPath.concat(ctx.project.ios.assets);

    const iosProjectInfo = findXcodeProject(
      fs.readdirSync(iosPath, {
        encoding: 'utf8',
        recursive: true,
      }),
    );

    if (!iosProjectInfo) {
      throw new CLIError(
        `Could not find Xcode project files in "${iosPath}" folder`,
      );
    }

    const pbxprojPath = findPbxprojFile(iosProjectInfo);
    iosPbxprojFilePath = path.join(iosPath, pbxprojPath);
  }

  const rootPath = ctx.root;

  const fontLinkOptions = fontTypes.reduce(
    (result: LinkOptionsPerExt, fontType) => {
      result[fontType] = getLinkOptions('font', androidPath, androidAppName);
      return result;
    },
    {},
  );

  const imageLinkOptions = imageTypes.reduce(
    (result: LinkOptionsPerExt, imageType) => {
      result[imageType] = getLinkOptions('image', androidPath, androidAppName);
      return result;
    },
    {},
  );

  const audioLinkOptions = audioTypes.reduce(
    (result: LinkOptionsPerExt, audioType) => {
      result[audioType] = getLinkOptions('audio', androidPath, androidAppName);
      return result;
    },
    {},
  );

  const linkOptionsPerExt: LinkOptionsPerExt = {
    ...fontLinkOptions,
    ...imageLinkOptions,
    ...audioLinkOptions,
  };

  const customLinkOptions = getLinkOptions(
    'custom',
    androidPath,
    androidAppName,
  );

  const linkPlatformOptions: LinkPlatformOptions[] = [
    {
      name: 'Android',
      enabled: true,
      platform: 'android',
      rootPath,
      assetsPaths: androidAssetsPath,
      manifest: getManifest(androidPath, 'android'),
      platformConfig: {
        exists: !!ctx.project.android,
        path: androidPath,
      },
      cleanAssets: cleanAndroidAssets,
      copyAssets: copyAndroidAssets,
      linkOptionsPerExt: {
        otf: linkOptionsPerExt?.otf?.android,
        ttf: linkOptionsPerExt?.ttf?.android,
        png: linkOptionsPerExt?.png?.android,
        jpg: linkOptionsPerExt?.jpg?.android,
        gif: linkOptionsPerExt?.gif?.android,
        mp3: linkOptionsPerExt?.mp3?.android,
      },
      otherLinkOptions: customLinkOptions.android,
    },
    {
      name: 'iOS',
      enabled: true,
      platform: 'ios',
      rootPath,
      assetsPaths: iosAssetsPath,
      manifest: getManifest(iosPath, 'ios'),
      platformConfig: {
        exists: !!ctx.project.ios,
        path: iosPath,
        pbxprojFilePath: iosPbxprojFilePath!,
      },
      cleanAssets: cleanIOSAssets,
      copyAssets: copyIOSAssets,
      linkOptionsPerExt: {
        otf: linkOptionsPerExt?.otf?.ios,
        ttf: linkOptionsPerExt?.ttf?.ios,
        mp3: linkOptionsPerExt?.mp3?.ios,
      },
      otherLinkOptions: customLinkOptions.ios,
    },
  ];

  linkPlatformOptions
    .filter(({enabled, platformConfig}) => enabled && platformConfig.exists)
    .forEach(linkPlatform);
}

export default {
  func: linkAssets,
  name: 'link-assets',
  description: 'Links your assets to Android / iOS projects.',
  options: [],
};

export {linkAssets};
