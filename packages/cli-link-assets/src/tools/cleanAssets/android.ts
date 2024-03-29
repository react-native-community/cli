import {isProjectUsingKotlin} from '@react-native-community/cli-platform-android';
import {CLIError} from '@react-native-community/cli-tools';
import fs from 'fs-extra';
import path from 'path';
import {
  FontFamilyMap,
  FontXMLObject,
  REACT_FONT_MANAGER_IMPORT,
  convertToAndroidResourceName,
  getAddCustomFontMethodCall,
  getFontFamily,
  getFontResFolderPath,
  getProjectFilePath,
  getXMLFontFilePath,
  getXMLFontId,
  readAndParseFontFile,
  readAndParseFontXMLFile,
  removeLineFromFile,
  writeFontXMLFile,
  xmlBuilder,
} from '../helpers/font/androidFontAssetHelpers';
import {AndroidCleanAssetsOptions, CleanAssets} from './types';

const cleanAssetsAndroid: CleanAssets = (assetFiles, options) => {
  const {
    platformPath,
    platformAssetsPath,
    shouldUseFontXMLFiles,
    isResourceFile,
  } = options as AndroidCleanAssetsOptions;
  const isUsingKotlin = isProjectUsingKotlin(platformPath);

  // If the assets are not fonts and are not linked with XML files, just remove them.
  if (!shouldUseFontXMLFiles) {
    assetFiles.forEach((file) => {
      const fileName = isResourceFile
        ? convertToAndroidResourceName(path.basename(file))
        : path.basename(file);
      const filePath = path.join(platformAssetsPath, fileName);
      try {
        fs.removeSync(filePath);
      } catch (e) {
        throw new CLIError(
          `Failed to delete "${filePath}" asset file.`,
          e as Error,
        );
      }
    });

    return;
  }

  const fontFamilyMap: FontFamilyMap = {};

  assetFiles.forEach((file) => {
    const fontFilePath = path.join(
      getFontResFolderPath(platformPath),
      convertToAndroidResourceName(path.basename(file)),
    );

    const font = readAndParseFontFile(fontFilePath);

    // Build the font family's map, where each key is the font family name,
    // and each value is a object containing all the font files related to that
    // font family.
    const fontFamily = getFontFamily(
      font.tables.name.fontFamily,
      font.tables.name.preferredFamily,
    );
    if (!fontFamilyMap[fontFamily]) {
      fontFamilyMap[fontFamily] = {
        id: convertToAndroidResourceName(fontFamily),
        files: [],
      };
    }

    fontFamilyMap[fontFamily].files.push({
      name: convertToAndroidResourceName(path.basename(file)),
      path: fontFilePath,
      weight: 0,
      isItalic: false,
    });
  });

  // Read MainApplication file.
  const mainApplicationFilePath = getProjectFilePath(
    platformPath,
    'MainApplication',
  );
  let mainApplicationFileData = fs
    .readFileSync(mainApplicationFilePath)
    .toString();

  Object.entries(fontFamilyMap).forEach(([fontFamilyName, fontFamilyData]) => {
    const xmlFilePath = getXMLFontFilePath(platformPath, fontFamilyData.id);

    let xmlObject: FontXMLObject;

    if (fs.existsSync(xmlFilePath)) {
      // XML font file already exists, so we remove the entries.
      xmlObject = readAndParseFontXMLFile(xmlFilePath);

      fontFamilyData.files.forEach((file) => {
        const foundEntryIndex = xmlObject['font-family'].font.findIndex(
          (entry) => entry['@_app:font'] === getXMLFontId(file.name),
        );
        if (foundEntryIndex !== -1) {
          xmlObject['font-family'].font.splice(foundEntryIndex, 1);
        }
      });

      if (xmlObject['font-family'].font.length > 0) {
        // We still have some fonts declared in the XML font file.
        // Write the XML font file.
        const xmlData = xmlBuilder.build(xmlObject);
        writeFontXMLFile(xmlFilePath, xmlData);
      } else {
        try {
          // We remove the XML font file and method call
          // because there aren't fonts declared inside it.
          fs.removeSync(xmlFilePath);
        } catch (e) {
          throw new CLIError(
            `Failed to delete "${xmlFilePath}" XML font file.`,
            e as Error,
          );
        }

        mainApplicationFileData = removeLineFromFile(
          mainApplicationFileData,
          getAddCustomFontMethodCall(
            fontFamilyName,
            fontFamilyData.id,
            isUsingKotlin,
          ),
        );
      }
    }

    // If there are not usages of ReactFontManager, we try to remove the import as well.
    if (!mainApplicationFileData.includes('ReactFontManager.')) {
      mainApplicationFileData = removeLineFromFile(
        mainApplicationFileData,
        `${REACT_FONT_MANAGER_IMPORT}${isUsingKotlin ? '' : ';'}`,
      );
    }

    try {
      // Write the modified contents to MainApplication file.
      fs.writeFileSync(mainApplicationFilePath, mainApplicationFileData);
    } catch (e) {
      throw new CLIError(
        `Failed to update "${mainApplicationFilePath}" file.`,
        e as Error,
      );
    }

    // Remove the font files from assets folder.
    fontFamilyData.files.forEach((file) => {
      try {
        fs.removeSync(file.path);
      } catch (e) {
        throw new CLIError(
          `Failed to delete "${file.path}" font file.`,
          e as Error,
        );
      }
    });
  });
};

export default cleanAssetsAndroid;
