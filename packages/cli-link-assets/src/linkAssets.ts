import {logger} from '@react-native-community/cli-tools';
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

async function linkAssets(
  _argv: string[],
  ctx: CLIConfig,
  linkAssetsOptions: Args,
): Promise<void> {
  logger.info('linkAssets!');
  console.log(JSON.stringify(ctx));

  let androidPath: string = '';
  let androidAssetsPath: string[] = [];
  let androidAppName: string = '';
  if (ctx.project.android) {
    androidPath = ctx.project.android.sourceDir;
    androidAssetsPath = ctx.project.android.assets;
    androidAppName = ctx.project.android.appName;
  }

  let iosPath: string = '';
  let iosAssetsPath: string[] = [];
  let iosPbxprojFilePath: string | null = null;
  if (ctx.project.ios) {
    iosPath = ctx.project.ios.sourceDir;
    iosAssetsPath = ctx.project.ios.assets;
    iosPbxprojFilePath = findPbxprojFile(
      fs.readdirSync(iosPath, {
        encoding: 'utf8',
        recursive: true,
      }),
    );
  }

  const rootPath = path.isAbsolute(linkAssetsOptions.projectRoot)
    ? linkAssetsOptions.projectRoot
    : path.resolve(process.cwd(), linkAssetsOptions.projectRoot);

  const fontLinkOptions = fontTypes.reduce(
    (result: LinkOptionsPerExt, fontType) => {
      const baseFontOptions: LinkOptions = {
        android: {
          path: path.resolve(
            androidPath,
            androidAppName,
            'src',
            'main',
            'assets',
            'fonts',
          ),
          useFontXMLFiles: true,
        },
        ios: {
          addFont: true,
        },
      };

      result[fontType] = baseFontOptions;
      return result;
    },
    {},
  );

  const imageLinkOptions = imageTypes.reduce(
    (result: LinkOptionsPerExt, imageType) => {
      const baseImageOptions: LinkOptions = {
        android: {
          path: path.resolve(
            androidPath,
            androidAppName,
            'src',
            'main',
            'res',
            'drawable',
          ),
          useFontXMLFiles: false,
        },
        ios: {
          addFont: false,
        },
      };

      result[imageType] = baseImageOptions;
      return result;
    },
    {},
  );

  const audioLinkOptions = audioTypes.reduce(
    (result: LinkOptionsPerExt, audioType) => {
      const baseAudioOptions: LinkOptions = {
        android: {
          path: path.resolve(
            androidPath,
            androidAppName,
            'src',
            'main',
            'res',
            'raw',
          ),
          useFontXMLFiles: false,
        },
        ios: {
          addFont: false,
        },
      };

      result[audioType] = baseAudioOptions;
      return result;
    },
    {},
  );

  const linkOptionsPerExt: LinkOptionsPerExt = {
    ...fontLinkOptions,
    ...imageLinkOptions,
    ...audioLinkOptions,
  };

  const customLinkOptions: LinkOptions = {
    android: {
      path: path.resolve(androidPath, 'app', 'src', 'main', 'assets', 'custom'),
      useFontXMLFiles: false,
    },
    ios: {
      addFont: false,
    },
  };

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
