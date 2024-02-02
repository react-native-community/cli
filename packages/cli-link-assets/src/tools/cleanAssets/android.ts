import fs from 'fs-extra';
import OpenType from 'opentype.js';
import path from 'path';
import {
  FontFamilyMap,
  FontXMLObject,
  REACT_FONT_MANAGER_IMPORT,
  getAddCustomFontMethodCall,
  getFontFamily,
  getFontResFolderPath,
  getProjectFilePath,
  getXMLFontId,
  normalizeString,
  removeLineFromFile,
  toArrayBuffer,
  xmlBuilder,
  xmlParser,
} from '../helpers/font/androidFontAssetHelpers';
import {AndroidCleanAssetsOptions, CleanAssets} from './types';
import {CLIError} from '@react-native-community/cli-tools';

const cleanAssetsAndroid: CleanAssets = (assetFiles, options) => {
  const {platformPath, platformAssetsPath, shouldUseFontXMLFiles} =
    options as AndroidCleanAssetsOptions;

  // If the assets are not fonts and are not linked with XML files, just remove them.
  if (!shouldUseFontXMLFiles) {
    assetFiles.forEach((file) => {
      const fileName = path.join(platformAssetsPath, path.basename(file));
      try {
        fs.removeSync(fileName);
      } catch (e) {
        throw new CLIError(
          `Failed to delete "${fileName}" asset file.`,
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
      normalizeString(path.basename(file)),
    );

    let buffer: Buffer;
    try {
      buffer = fs.readFileSync(fontFilePath);
    } catch (e) {
      throw new CLIError(
        `Failed to read "${fontFilePath}" font file.`,
        e as Error,
      );
    }

    const font = OpenType.parse(toArrayBuffer(buffer));

    // Build the font family's map, where each key is the font family name,
    // and each value is a object containing all the font files related to that
    // font family.
    const fontFamily = getFontFamily(
      font.tables.name.fontFamily,
      font.tables.name.preferredFamily,
    );
    if (!fontFamilyMap[fontFamily]) {
      fontFamilyMap[fontFamily] = {
        id: normalizeString(fontFamily),
        files: [],
      };
    }

    fontFamilyMap[fontFamily].files.push({
      name: normalizeString(path.basename(file)),
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
    const xmlFileName = `${fontFamilyData.id}.xml`;
    const xmlFilePath = path.join(
      getFontResFolderPath(platformPath),
      xmlFileName,
    );
    let xmlObject: FontXMLObject;

    if (fs.existsSync(xmlFilePath)) {
      try {
        // XML font file already exists, so we remove the entries.
        xmlObject = xmlParser.parse(fs.readFileSync(xmlFilePath));
      } catch (e) {
        throw new CLIError(
          `Failed to read "${xmlFilePath}" XML font file.`,
          e as Error,
        );
      }

      fontFamilyData.files.forEach((file) => {
        const foundEntryIndex = xmlObject['font-family'].font.findIndex(
          (entry) => entry['@_app:font'] === getXMLFontId(file.name),
        );
        if (foundEntryIndex !== -1) {
          xmlObject['font-family'].font.splice(foundEntryIndex, 1);
        }
      });

      if (xmlObject['font-family'].font.length > 0) {
        try {
          // We still have some fonts declared in the XML font file.
          // Write the XML font file.
          const xmlData = xmlBuilder.build(xmlObject);
          fs.outputFileSync(xmlFilePath, xmlData);
        } catch (e) {
          throw new CLIError(
            `Failed to update "${xmlFilePath}" XML font file.`,
            e as Error,
          );
        }
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
          getAddCustomFontMethodCall(fontFamilyName, fontFamilyData.id),
        );
      }
    }

    // If there are not usages of ReactFontManager, we try to remove the import as well.
    if (!mainApplicationFileData.includes('ReactFontManager.')) {
      mainApplicationFileData = removeLineFromFile(
        mainApplicationFileData,
        REACT_FONT_MANAGER_IMPORT,
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
