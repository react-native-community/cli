import fs from 'fs-extra';
import OpenType from 'opentype.js';
import path from 'path';
import {
  FontFamilyMap,
  FontXMLObject,
  REACT_FONT_MANAGER_JAVA_IMPORT,
  getAddCustomFontMethodCall,
  getFontFamily,
  getFontResFolderPath,
  getProjectFilePath,
  getXMLFontId,
  normalizeString,
  removeLineFromJavaFile,
  toArrayBuffer,
  xmlBuilder,
  xmlParser,
} from '../androidFontAssetHelpers';
import {AndroidCleanAssetsOptions, CleanAssets} from './types';

const cleanAssets: CleanAssets = (assetFiles, options) => {
  const {platformPath, platformAssetsPath, useFontXMLFiles} =
    options as AndroidCleanAssetsOptions;

  // If the assets are not fonts and are not linked with XML files, just remove them.
  if (!useFontXMLFiles) {
    assetFiles.forEach((file) =>
      fs.removeSync(path.join(platformAssetsPath, path.basename(file))),
    );
    return;
  }

  const fontFamilyMap: FontFamilyMap = {};

  assetFiles.forEach((file) => {
    const fontFilePath = path.join(
      getFontResFolderPath(platformPath),
      normalizeString(path.basename(file)),
    );

    const buffer = fs.readFileSync(fontFilePath);
    const font = OpenType.parse(toArrayBuffer(buffer));

    // Build the font family's map, where each key is the font family name,
    // and each value is a object containing all the font files related to that
    // font family.
    console.log('font.names', font.names);
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

  // Read MainApplication.java file.
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
      // XML font file already exists, so we remove the entries.
      xmlObject = xmlParser.parse(fs.readFileSync(xmlFilePath));

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
        fs.outputFileSync(xmlFilePath, xmlData);
      } else {
        // We remove the XML font file and method call
        // because there aren't fonts declared inside it.
        fs.removeSync(xmlFilePath);

        mainApplicationFileData = removeLineFromJavaFile(
          mainApplicationFileData,
          getAddCustomFontMethodCall(fontFamilyName, fontFamilyData.id),
        );
      }
    }

    // If there are not usages of ReactFontManager, we try to remove the import as well.
    if (!mainApplicationFileData.includes('ReactFontManager.')) {
      mainApplicationFileData = removeLineFromJavaFile(
        mainApplicationFileData,
        REACT_FONT_MANAGER_JAVA_IMPORT,
      );
    }

    // Write the modified contents to MainApplication.java file.
    fs.writeFileSync(mainApplicationFilePath, mainApplicationFileData);

    // Remove the font files from assets folder.
    fontFamilyData.files.forEach((file) => fs.removeSync(file.path));
  });
};

export default cleanAssets;
