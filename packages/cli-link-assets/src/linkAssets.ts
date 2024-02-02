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

type Args = {
  projectRoot: string;
};

function findPbxprojFile(files: Array<string>): string | null {
  const sortedFiles = files.sort();

  for (let i = sortedFiles.length - 1; i >= 0; i--) {
    const fileName = files[i];
    const ext = path.extname(fileName);

    if (ext === '.pbxproj') {
      return fileName;
    }
  }

  return null;
}

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

async function linkAssets(
  _argv: string[],
  ctx: CLIConfig,
  linkAssetsOptions: Args,
): Promise<void> {
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

    const pbxprojPath = findPbxprojFile(
      fs.readdirSync(iosPath, {
        encoding: 'utf8',
        recursive: true,
      }),
    );

    if (pbxprojPath) {
      iosPbxprojFilePath = path.join(iosPath, pbxprojPath);
    }
  }

  const rootPath = path.isAbsolute(linkAssetsOptions.projectRoot)
    ? linkAssetsOptions.projectRoot
    : path.resolve(process.cwd(), linkAssetsOptions.projectRoot);

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
        pbxprojFilePath: iosPbxprojFilePath,
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
  description: 'TODO',
  options: [
    {
      name: '--project-root <string>',
      description:
        'Root path to your React Native project. When not specified, defaults to current working directory.',
      default: process.cwd(),
    },
  ],
};
