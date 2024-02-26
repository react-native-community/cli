import type {Config as CLIConfig} from '@react-native-community/cli-types';
import type FS from 'fs';
import type Path from 'path';
import snapshotDiff from 'snapshot-diff';
import {PartialDeep} from 'type-fest';
import xcode from 'xcode';
import {cleanup, getTempDirectory, writeFiles} from '../../../../jest/helpers';
import {
  baseProjectJava,
  baseProjectKotlin,
  fixtureFilePaths,
  fixtureFiles,
} from '../__fixtures__/projects';
import {linkAssets} from '../linkAssets';
import getGroup from '../tools/helpers/xcode/getGroup';
import {ManifestFile} from '../tools/manifest';
import '../xcode.d.ts';

const fs = jest.requireActual<typeof FS>('fs');
const path = jest.requireActual<typeof Path>('path');

const DIR = getTempDirectory('temp-project');

const readMainApplicationKotlinFile = () =>
  fs.readFileSync(
    path.resolve(DIR, fixtureFilePaths.mainApplicationKotlin),
    'utf8',
  );

const readMainApplicationJavaFile = () =>
  fs.readFileSync(
    path.resolve(DIR, fixtureFilePaths.mainApplicationJava),
    'utf8',
  );

const readAndroidLinkAssetsManifestFile = () =>
  fs.readFileSync(
    path.resolve(DIR, 'android/link-assets-manifest.json'),
    'utf8',
  );

const readInfoPlistFile = () =>
  fs.readFileSync(path.resolve(DIR, fixtureFilePaths.infoPlist), 'utf8');

const readIOSLinkAssetsManifestFile = () =>
  fs.readFileSync(path.resolve(DIR, 'ios/link-assets-manifest.json'), 'utf8');

const readLatoXMLFontFile = () =>
  fs.readFileSync(
    path.resolve(DIR, 'android/app/src/main/res/font/lato.xml'),
    'utf8',
  );

const readLatoBoldFontFile = () =>
  fs.readFileSync(
    path.resolve(DIR, 'android/app/src/main/res/font/lato_bold.ttf'),
    'utf8',
  );

const readLatoBoldItalicFontFile = () =>
  fs.readFileSync(
    path.resolve(DIR, 'android/app/src/main/res/font/lato_bolditalic.ttf'),
    'utf8',
  );

const readLatoRegularFontFile = () =>
  fs.readFileSync(
    path.resolve(DIR, 'android/app/src/main/res/font/lato_regular.ttf'),
    'utf8',
  );

const readLatoLightFontFile = () =>
  fs.readFileSync(
    path.resolve(DIR, 'android/app/src/main/res/font/lato_light.ttf'),
    'utf8',
  );

const readFiraCodeXMLFontFile = () =>
  fs.readFileSync(
    path.resolve(DIR, 'android/app/src/main/res/font/fira_code.xml'),
    'utf8',
  );

const readFiraCodeBoldFontFile = () =>
  fs.readFileSync(
    path.resolve(DIR, 'android/app/src/main/res/font/firacode_bold.otf'),
    'utf8',
  );

const readFiraCodeRegularFontFile = () =>
  fs.readFileSync(
    path.resolve(DIR, 'android/app/src/main/res/font/firacode_regular.otf'),
    'utf8',
  );

const readMontserratXMLFontFile = () =>
  fs.readFileSync(
    path.resolve(DIR, 'android/app/src/main/res/font/montserrat.xml'),
    'utf8',
  );

const readMontserratRegularFontFile = () =>
  fs.readFileSync(
    path.resolve(DIR, 'android/app/src/main/res/font/montserrat_regular.ttf'),
    'utf8',
  );

const readDocumentPdfFile = () =>
  fs.readFileSync(
    path.resolve(DIR, 'android/app/src/main/assets/custom/document.pdf'),
    'utf8',
  );

const readImageGifFile = () =>
  fs.readFileSync(
    path.resolve(DIR, 'android/app/src/main/res/drawable/image_gif.gif'),
    'utf8',
  );

const readImageJpgFile = () =>
  fs.readFileSync(
    path.resolve(DIR, 'android/app/src/main/res/drawable/image_jpg.jpg'),
    'utf8',
  );

const readImagePngFile = () =>
  fs.readFileSync(
    path.resolve(DIR, 'android/app/src/main/res/drawable/image_png.png'),
    'utf8',
  );

const readSoundMp3File = () =>
  fs.readFileSync(
    path.resolve(DIR, 'android/app/src/main/res/raw/sound.mp3'),
    'utf8',
  );

const getIOSProjectResourcesGroup = () => {
  const project = xcode
    .project(path.resolve(DIR, fixtureFilePaths.projectPbxproj))
    .parseSync();
  return getGroup(project, 'Resources');
};

const testBaseProjectStructure = (isKotlinProject = true) => {
  const baseProject = isKotlinProject ? baseProjectKotlin : baseProjectJava;
  const mainApplicationFilePath = isKotlinProject
    ? fixtureFilePaths.mainApplicationKotlin
    : fixtureFilePaths.mainApplicationJava;

  // Android
  expect(
    snapshotDiff(
      baseProject[mainApplicationFilePath].toString(),
      isKotlinProject
        ? readMainApplicationKotlinFile()
        : readMainApplicationJavaFile(),
    ),
  ).toMatchSnapshot();
  expect(
    snapshotDiff('', readAndroidLinkAssetsManifestFile()),
  ).toMatchSnapshot();

  expect(snapshotDiff('', readLatoXMLFontFile())).toMatchSnapshot();
  expect(snapshotDiff('', readFiraCodeXMLFontFile())).toMatchSnapshot();

  const linkedAssetsMap = {
    [fixtureFilePaths.latoBoldFont]: readLatoBoldFontFile(),
    [fixtureFilePaths.latoBoldItalicFont]: readLatoBoldItalicFontFile(),
    [fixtureFilePaths.latoRegularFont]: readLatoRegularFontFile(),
    [fixtureFilePaths.firaCodeBoldFont]: readFiraCodeBoldFontFile(),
    [fixtureFilePaths.firaCodeRegularFont]: readFiraCodeRegularFontFile(),
    [fixtureFilePaths.documentPdf]: readDocumentPdfFile(),
    [fixtureFilePaths.soundMp3]: readSoundMp3File(),
    [fixtureFilePaths.imageGif]: readImageGifFile(),
    [fixtureFilePaths.imageJpg]: readImageJpgFile(),
    [fixtureFilePaths.imagePng]: readImagePngFile(),
  };
  for (const assetEntry of Object.entries(linkedAssetsMap)) {
    expect(baseProjectKotlin[assetEntry[0]].toString()).toEqual(assetEntry[1]);
  }

  // iOS
  expect(
    snapshotDiff(
      baseProjectKotlin[fixtureFilePaths.infoPlist].toString(),
      readInfoPlistFile(),
    ),
  ).toMatchSnapshot();
  expect(snapshotDiff('', readIOSLinkAssetsManifestFile())).toMatchSnapshot();

  const resourcesGroup = getIOSProjectResourcesGroup();
  expect(resourcesGroup?.children.length).toBe(9);
  [
    fixtureFilePaths.firaCodeBoldFont,
    fixtureFilePaths.firaCodeRegularFont,
    fixtureFilePaths.latoRegularFont,
    fixtureFilePaths.ralewayRegularFont,
    fixtureFilePaths.soundMp3,
    fixtureFilePaths.imageGif,
    fixtureFilePaths.imageJpg,
    fixtureFilePaths.imagePng,
    fixtureFilePaths.documentPdf,
  ]
    .map((filePath) => path.basename(filePath))
    .forEach((fileName) => {
      expect(
        resourcesGroup?.children.some((r) => r.comment === fileName),
      ).toBeTruthy();
    });
};

beforeEach(() => {
  cleanup(DIR);
  jest.resetModules();
  jest.clearAllMocks();
});

afterEach(() => cleanup(DIR));

describe('linkAssets', () => {
  const configMock: PartialDeep<CLIConfig> = {
    root: DIR,
    assets: ['./assets/shared'],
    project: {
      android: {
        sourceDir: `${DIR}/android`,
        appName: 'app',
        assets: ['./assets/android'],
      },
      ios: {
        sourceDir: `${DIR}/ios`,
        assets: ['./assets/ios'],
      },
    },
  };

  it('should link all types of assets in a Kotlin project for the first time', async () => {
    writeFiles(DIR, baseProjectKotlin);

    await linkAssets([], configMock as CLIConfig);

    testBaseProjectStructure(true);
  });

  it('should link all types of assets in a Java project for the first time', async () => {
    writeFiles(DIR, baseProjectJava);

    await linkAssets([], configMock as CLIConfig);

    testBaseProjectStructure(false);
  });

  it('should link new assets in a project', async () => {
    writeFiles(DIR, baseProjectKotlin);

    await linkAssets([], configMock as CLIConfig);

    const oldAndroidLinkAssetsManifestFile =
      readAndroidLinkAssetsManifestFile();
    const oldMainApplicationFile = readMainApplicationKotlinFile();
    const oldLatoXMLFontFile = readLatoXMLFontFile();
    const oldIOSLinkAssetsManifestFile = readIOSLinkAssetsManifestFile();
    const oldInfoPlistFile = readInfoPlistFile();

    writeFiles(DIR, {
      [fixtureFilePaths.latoLightFont]: fixtureFiles.latoLightFont,
      [fixtureFilePaths.montserratRegularFont]:
        fixtureFiles.montserratRegularFont,
    });

    await linkAssets([], configMock as CLIConfig);

    // Android
    expect(
      snapshotDiff(
        oldAndroidLinkAssetsManifestFile,
        readAndroidLinkAssetsManifestFile(),
      ),
    ).toMatchSnapshot();
    expect(
      snapshotDiff(oldMainApplicationFile, readMainApplicationKotlinFile()),
    ).toMatchSnapshot();
    expect(
      snapshotDiff(oldLatoXMLFontFile, readLatoXMLFontFile()),
    ).toMatchSnapshot();
    expect(fixtureFiles.latoLightFont.toString()).toEqual(
      readLatoLightFontFile(),
    );
    expect(snapshotDiff('', readMontserratXMLFontFile())).toMatchSnapshot();
    expect(fixtureFiles.montserratRegularFont.toString()).toEqual(
      readMontserratRegularFontFile(),
    );

    // iOS
    expect(
      snapshotDiff(
        oldIOSLinkAssetsManifestFile,
        readIOSLinkAssetsManifestFile(),
      ),
    ).toMatchSnapshot();
    expect(
      snapshotDiff(oldInfoPlistFile, readInfoPlistFile()),
    ).toMatchSnapshot();

    const resourcesGroup = getIOSProjectResourcesGroup();
    expect(resourcesGroup?.children.length).toBe(10);
    [
      fixtureFilePaths.firaCodeBoldFont,
      fixtureFilePaths.firaCodeRegularFont,
      fixtureFilePaths.latoRegularFont,
      fixtureFilePaths.ralewayRegularFont,
      fixtureFilePaths.soundMp3,
      fixtureFilePaths.imageGif,
      fixtureFilePaths.imageJpg,
      fixtureFilePaths.imagePng,
      fixtureFilePaths.documentPdf,
      fixtureFilePaths.latoLightFont,
    ]
      .map((filePath) => path.basename(filePath))
      .forEach((fileName) => {
        expect(
          resourcesGroup?.children.some((r) => r.comment === fileName),
        ).toBeTruthy();
      });
  });

  it('should unlink deleted assets in a project', async () => {
    writeFiles(DIR, baseProjectKotlin);

    await linkAssets([], configMock as CLIConfig);

    const oldAndroidLinkAssetsManifestFile =
      readAndroidLinkAssetsManifestFile();
    const oldMainApplicationFile = readMainApplicationKotlinFile();
    const oldLatoXMLFontFile = readLatoXMLFontFile();
    const oldIOSLinkAssetsManifestFile = readIOSLinkAssetsManifestFile();
    const oldInfoPlistFile = readInfoPlistFile();

    fs.rmSync(path.resolve(DIR, fixtureFilePaths.firaCodeBoldFont));
    fs.rmSync(path.resolve(DIR, fixtureFilePaths.firaCodeRegularFont));
    fs.rmSync(path.resolve(DIR, fixtureFilePaths.latoBoldItalicFont));
    fs.rmSync(path.resolve(DIR, fixtureFilePaths.documentPdf));
    fs.rmSync(path.resolve(DIR, fixtureFilePaths.imageGif));
    fs.rmSync(path.resolve(DIR, fixtureFilePaths.soundMp3));

    await linkAssets([], configMock as CLIConfig);

    // Android
    expect(
      snapshotDiff(
        oldAndroidLinkAssetsManifestFile,
        readAndroidLinkAssetsManifestFile(),
      ),
    ).toMatchSnapshot();
    expect(
      snapshotDiff(oldMainApplicationFile, readMainApplicationKotlinFile()),
    ).toMatchSnapshot();
    expect(
      snapshotDiff(oldLatoXMLFontFile, readLatoXMLFontFile()),
    ).toMatchSnapshot();
    expect(readFiraCodeXMLFontFile).toThrow();
    expect(readFiraCodeBoldFontFile).toThrow();
    expect(readFiraCodeRegularFontFile).toThrow();
    expect(readLatoBoldItalicFontFile).toThrow();
    expect(readDocumentPdfFile).toThrow();
    expect(readImageGifFile).toThrow();
    expect(readSoundMp3File).toThrow();

    // iOS
    expect(
      snapshotDiff(
        oldIOSLinkAssetsManifestFile,
        readIOSLinkAssetsManifestFile(),
      ),
    ).toMatchSnapshot();
    expect(
      snapshotDiff(oldInfoPlistFile, readInfoPlistFile()),
    ).toMatchSnapshot();

    const resourcesGroup = getIOSProjectResourcesGroup();
    expect(resourcesGroup?.children.length).toBe(4);
    [
      fixtureFilePaths.latoRegularFont,
      fixtureFilePaths.ralewayRegularFont,
      fixtureFilePaths.imageJpg,
      fixtureFilePaths.imagePng,
    ]
      .map((filePath) => path.basename(filePath))
      .forEach((fileName) => {
        expect(
          resourcesGroup?.children.some((r) => r.comment === fileName),
        ).toBeTruthy();
      });
  });

  it('should unlink all assets in a project', async () => {
    writeFiles(DIR, baseProjectKotlin);

    await linkAssets([], configMock as CLIConfig);

    const oldAndroidLinkAssetsManifestFile =
      readAndroidLinkAssetsManifestFile();
    const oldMainApplicationFile = readMainApplicationKotlinFile();
    const oldIOSLinkAssetsManifestFile = readIOSLinkAssetsManifestFile();
    const oldInfoPlistFile = readInfoPlistFile();

    const sharedAssetsPath = path.resolve(DIR, 'assets/shared');
    const androidAssetsPath = path.resolve(DIR, 'assets/android');
    const iosAssetsPath = path.resolve(DIR, 'assets/ios');
    fs.readdirSync(sharedAssetsPath).forEach((file) =>
      fs.rmSync(path.resolve(sharedAssetsPath, file), {recursive: true}),
    );
    fs.readdirSync(androidAssetsPath).forEach((file) =>
      fs.rmSync(path.resolve(androidAssetsPath, file), {recursive: true}),
    );
    fs.readdirSync(iosAssetsPath).forEach((file) =>
      fs.rmSync(path.resolve(iosAssetsPath, file), {recursive: true}),
    );

    await linkAssets([], configMock as CLIConfig);

    // Android
    expect(
      snapshotDiff(
        oldAndroidLinkAssetsManifestFile,
        readAndroidLinkAssetsManifestFile(),
      ),
    ).toMatchSnapshot();
    expect(
      snapshotDiff(oldMainApplicationFile, readMainApplicationKotlinFile()),
    ).toMatchSnapshot();
    expect(
      fs.readdirSync(path.resolve(DIR, 'android/app/src/main/assets/custom'))
        .length,
    ).toBe(0);
    expect(
      fs.readdirSync(path.resolve(DIR, 'android/app/src/main/res/drawable'))
        .length,
    ).toBe(0);
    expect(
      fs.readdirSync(path.resolve(DIR, 'android/app/src/main/res/font')).length,
    ).toBe(0);
    expect(
      fs.readdirSync(path.resolve(DIR, 'android/app/src/main/res/raw')).length,
    ).toBe(0);

    // iOS
    expect(
      snapshotDiff(
        oldIOSLinkAssetsManifestFile,
        readIOSLinkAssetsManifestFile(),
      ),
    ).toMatchSnapshot();
    expect(
      snapshotDiff(oldInfoPlistFile, readInfoPlistFile()),
    ).toMatchSnapshot();

    const resourcesGroup = getIOSProjectResourcesGroup();
    expect(resourcesGroup?.children.length).toBe(0);
  });

  it('should relink font assets from an Android project to use XML resources', async () => {
    writeFiles(DIR, baseProjectKotlin);

    await linkAssets([], configMock as CLIConfig);

    // Change link-assets-manifest.json to simulate old version
    const oldAndroidLinkAssetsManifestJson = JSON.parse(
      readAndroidLinkAssetsManifestFile(),
    ) as ManifestFile;
    oldAndroidLinkAssetsManifestJson.migIndex = 1;
    const oldAndroidLinkAssetsManifestFile = JSON.stringify(
      oldAndroidLinkAssetsManifestJson,
      undefined,
      2,
    );
    fs.writeFileSync(
      path.resolve(DIR, 'android/link-assets-manifest.json'),
      oldAndroidLinkAssetsManifestFile,
    );

    // Restore MainApplication.kt to original state to simulate old version
    const oldMainApplicationFile =
      fixtureFiles.mainApplicationKotlin.toString();
    fs.writeFileSync(
      path.resolve(DIR, fixtureFilePaths.mainApplicationKotlin),
      oldMainApplicationFile,
    );

    // Change link-assets-manifest.json to simulate old version
    const oldIOSLinkAssetsManifestJson = JSON.parse(
      readIOSLinkAssetsManifestFile(),
    ) as ManifestFile;
    oldIOSLinkAssetsManifestJson.migIndex = 1;
    const oldIOSLinkAssetsManifestFile = JSON.stringify(
      oldIOSLinkAssetsManifestJson,
      undefined,
      2,
    );
    fs.writeFileSync(
      path.resolve(DIR, 'ios/link-assets-manifest.json'),
      oldIOSLinkAssetsManifestFile,
    );

    // Remove fonts from `res/font` to simulate old version
    fs.readdirSync(path.resolve(DIR, 'android/app/src/main/res/font')).forEach(
      (file) =>
        fs.rmSync(
          path.resolve(
            path.resolve(DIR, 'android/app/src/main/res/font'),
            file,
          ),
          {recursive: true},
        ),
    );

    // Add fonts to `assets/font` to simulate old version
    writeFiles(DIR, {
      'android/app/src/main/assets/fonts/FireCode-Bold.otf':
        fixtureFiles.firaCodeBoldFont,
      'android/app/src/main/assets/fonts/FireCode-Regular.otf':
        fixtureFiles.firaCodeRegularFont,
      'android/app/src/main/assets/fonts/Lato-Bold.ttf':
        fixtureFiles.latoBoldFont,
      'android/app/src/main/assets/fonts/Lato-BoldItalic.ttf':
        fixtureFiles.latoBoldItalicFont,
      'android/app/src/main/assets/fonts/Lato-Regular.ttf':
        fixtureFiles.latoRegularFont,
    });

    await linkAssets([], configMock as CLIConfig);

    // Android
    expect(
      snapshotDiff(
        oldAndroidLinkAssetsManifestFile,
        readAndroidLinkAssetsManifestFile(),
      ),
    ).toMatchSnapshot();
    expect(
      snapshotDiff(oldMainApplicationFile, readMainApplicationKotlinFile()),
    ).toMatchSnapshot();

    expect(snapshotDiff('', readLatoXMLFontFile())).toMatchSnapshot();
    expect(snapshotDiff('', readFiraCodeXMLFontFile())).toMatchSnapshot();

    const linkedAssetsMap = {
      [fixtureFilePaths.latoBoldFont]: readLatoBoldFontFile(),
      [fixtureFilePaths.latoBoldItalicFont]: readLatoBoldItalicFontFile(),
      [fixtureFilePaths.latoRegularFont]: readLatoRegularFontFile(),
      [fixtureFilePaths.firaCodeBoldFont]: readFiraCodeBoldFontFile(),
      [fixtureFilePaths.firaCodeRegularFont]: readFiraCodeRegularFontFile(),
      [fixtureFilePaths.documentPdf]: readDocumentPdfFile(),
      [fixtureFilePaths.soundMp3]: readSoundMp3File(),
      [fixtureFilePaths.imageGif]: readImageGifFile(),
      [fixtureFilePaths.imageJpg]: readImageJpgFile(),
      [fixtureFilePaths.imagePng]: readImagePngFile(),
    };
    for (const assetEntry of Object.entries(linkedAssetsMap)) {
      expect(baseProjectKotlin[assetEntry[0]].toString()).toEqual(
        assetEntry[1],
      );
    }

    const deletedFontAssets = [
      'android/app/src/main/res/font/FiraCode-Bold.otf',
      'android/app/src/main/res/font/FiraCode-Regular.otf',
      'android/app/src/main/res/font/Lato-Bold.ttf',
      'android/app/src/main/res/font/Lato-BoldItalic.ttf',
      'android/app/src/main/res/font/Lato-Regular.ttf',
    ];
    for (const asset of deletedFontAssets) {
      expect(() => fs.readFileSync(path.resolve(DIR, asset), 'utf8')).toThrow();
    }

    // iOS
    expect(
      snapshotDiff(
        oldIOSLinkAssetsManifestFile,
        readIOSLinkAssetsManifestFile(),
      ),
    ).toMatchSnapshot();
  });
});
