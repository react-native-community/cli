import fs from 'fs-extra';
import OpenType from 'opentype.js';
import path from 'path';
import {
  FontFamilyMap,
  FontXMLObject,
  REACT_FONT_MANAGER_IMPORT,
  addImportToFile,
  buildXMLFontObject,
  buildXMLFontObjectEntry,
  getAddCustomFontMethodCall,
  getFontFallbackWeight,
  getFontFamily,
  getFontResFolderPath,
  getProjectFilePath,
  getXMLFontId,
  insertLineInClassMethod,
  normalizeString,
  toArrayBuffer,
  xmlBuilder,
  xmlParser,
} from '../helpers/font/androidFontAssetHelpers';
import {AndroidCopyAssetsOptions, CopyAssets} from './types';
import {isProjectUsingKotlin} from '@react-native-community/cli-platform-android';

const copyAssets: CopyAssets = (assetFiles, options) => {
  const {platformPath, platformAssetsPath, shouldUseFontXMLFiles} =
    options as AndroidCopyAssetsOptions;
  const isUsingKotlin = isProjectUsingKotlin(platformPath);
  // If the assets are not fonts and don't need to link with XML files, just copy them.
  if (!shouldUseFontXMLFiles) {
    assetFiles.forEach((file) =>
      fs.copySync(file, path.join(platformAssetsPath, path.basename(file))),
    );
    return;
  }

  const mainApplicationFilePath = getProjectFilePath(
    platformPath,
    'MainApplication',
  );

  const fontFamilyMap: FontFamilyMap = {};

  assetFiles.forEach((file) => {
    const buffer = fs.readFileSync(file);
    const font = OpenType.parse(toArrayBuffer(buffer));

    const {
      /**
       * An number whose bits represent the font style.
       * Must be used in conjunction with "fsSelection".
       *
       * Bit 1: Italic (if set to 1).
       */
      macStyle,
    } = font.tables.head;

    const {
      /**
       * An number representing the weight of the font style.
       */
      usWeightClass,

      /**
       * An number whose bits represent the font style.
       * Must be used in conjunction with "macStyle".
       *
       * Bit 0: Italic (if set to 1).
       */
      fsSelection,
    } = font.tables.os2;

    const {
      /**
       * An number representing the italic angle of the font.
       */
      italicAngle,
    } = font.tables.post;

    /**
     * Bitmask to check if font style is italic.
     *
     * Reference: https://learn.microsoft.com/en-us/typography/opentype/spec/os2#fsselection
     */
    const fsSelectionItalicMask = 1;

    /**
     * Bitmask to check if font style is italic.
     *
     * Reference: https://learn.microsoft.com/en-us/typography/opentype/spec/head
     */
    const macStyleItalicMask = 2;

    const weight = getFontFallbackWeight(usWeightClass);

    /**
     * The font is italic if both "macStyle" and "fsSelection" italic bits are set.
     * If none of the bits are set, we look at the "italicAngle" as a last resource,
     * which must be different from zero to be considered italic.
     */
    const isItalic = Boolean(
      // eslint-disable-next-line no-bitwise
      (fsSelection & fsSelectionItalicMask && macStyle & macStyleItalicMask) ||
        italicAngle !== 0,
    );

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
      path: file,
      weight,
      isItalic,
    });
  });

  Object.entries(fontFamilyMap).forEach(([fontFamilyName, fontFamilyData]) => {
    const xmlFileName = `${fontFamilyData.id}.xml`;
    const xmlFilePath = path.join(
      getFontResFolderPath(platformPath),
      xmlFileName,
    );
    let xmlObject: FontXMLObject;

    if (fs.existsSync(xmlFilePath)) {
      // XML font file already exists, so we add new entries or replace existing ones.
      xmlObject = xmlParser.parse(fs.readFileSync(xmlFilePath));

      fontFamilyData.files.forEach((file) => {
        const xmlEntry = buildXMLFontObjectEntry(file);

        // We can't have style / weight duplicates.
        const foundEntryIndex = xmlObject['font-family'].font.findIndex(
          (entry) =>
            entry['@_app:font'] === getXMLFontId(file.name) ||
            (entry['@_app:fontStyle'] === xmlEntry['@_app:fontStyle'] &&
              entry['@_app:fontWeight'] === xmlEntry['@_app:fontWeight']),
        );

        if (foundEntryIndex !== -1) {
          xmlObject['font-family'].font[foundEntryIndex] = xmlEntry;
        } else {
          xmlObject['font-family'].font.push(xmlEntry);
        }
      });
    } else {
      // XML font file doesn't exist, so we create a new one.
      xmlObject = buildXMLFontObject(fontFamilyData.files);
    }

    // Sort the fonts by weight and style.
    xmlObject['font-family'].font.sort((a, b) => {
      const compareWeight = a['@_app:fontWeight'] - b['@_app:fontWeight'];
      const compareStyle = a['@_app:fontStyle'].localeCompare(
        b['@_app:fontStyle'],
      );
      return compareWeight || compareStyle;
    });

    const xmlData = xmlBuilder.build(xmlObject);

    // Copy the font files to font folder.
    fontFamilyData.files.forEach((file) =>
      fs.copySync(
        file.path,
        path.join(getFontResFolderPath(platformPath), path.basename(file.name)),
      ),
    );

    // Write the XML font file.
    fs.outputFileSync(xmlFilePath, xmlData);

    // Read MainApplication.java file.
    let mainApplicationFileData = fs
      .readFileSync(mainApplicationFilePath)
      .toString();

    // Add ReactFontManager's import.
    mainApplicationFileData = addImportToFile(
      mainApplicationFileData,
      REACT_FONT_MANAGER_IMPORT,
      isUsingKotlin,
    );

    // Insert add custom font's method call.
    mainApplicationFileData = insertLineInClassMethod(
      mainApplicationFileData,
      'MainApplication',
      'onCreate',
      getAddCustomFontMethodCall(
        fontFamilyName,
        fontFamilyData.id,
        isUsingKotlin,
      ),
      `super.onCreate()${isUsingKotlin ? '' : ';'}`,
      isUsingKotlin,
    );

    // Write the modified contents to MainApplication.java file.
    fs.writeFileSync(mainApplicationFilePath, mainApplicationFileData);
  });
};

export default copyAssets;
