import {isProjectUsingKotlin} from '@react-native-community/cli-platform-android';
import {logger} from '@react-native-community/cli-tools';
import {XMLBuilder, XMLParser} from 'fast-xml-parser';
import {sync as globSync} from 'glob';
import OpenType from 'opentype.js';
import path from 'path';
import slugify from 'slugify';

type FontXMLEntry = {
  '@_app:font': string;
  '@_app:fontStyle': string;
  '@_app:fontWeight': number;
};

type FontXMLObject = {
  '?xml': {
    '@_version': string;
    '@_encoding': string;
  };
  'font-family': {
    '@_xmlns:app': string;
    font: FontXMLEntry[];
  };
};

type FontFamilyFile = {
  name: string;
  path: string;
  weight: number;
  isItalic: boolean;
};

type FontFamilyEntry = {
  id: string;
  files: FontFamilyFile[];
};

type FontFamilyMap = Record<string, FontFamilyEntry>;

const REACT_FONT_MANAGER_IMPORT =
  'com.facebook.react.common.assets.ReactFontManager';

function toArrayBuffer(buffer: Buffer) {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);

  for (let i = 0; i < buffer.length; i += 1) {
    view[i] = buffer[i];
  }

  return arrayBuffer;
}

function normalizeString(str: string) {
  return slugify(str, {lower: true, replacement: '_'}).replace(/-/g, '_');
}

function getProjectFilePath(rootPath: string, name: string) {
  const isUsingKotlin = isProjectUsingKotlin(rootPath);
  const ext = isUsingKotlin ? 'kt' : 'java';
  const filePath = globSync(
    path.join(rootPath, `app/src/main/java/**/${name}.${ext}`),
  )[0];
  return filePath;
}

function getFontFamily(
  fontFamily: OpenType.LocalizedName,
  preferredFontFamily?: OpenType.LocalizedName,
) {
  const availableFontFamily = preferredFontFamily || fontFamily;
  return availableFontFamily.en || Object.values(availableFontFamily)[0];
}

/**
 * Calculate a fallback weight to ensure it is multiple of 100 and between 100 and 900.
 *
 * Reference: https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight#fallback_weights
 *
 * @param weight the font's weight.
 * @returns a fallback weight multiple of 100, between 100 and 900, inclusive.
 */
function getFontFallbackWeight(weight: number) {
  if (weight <= 500) {
    return Math.max(Math.floor(weight / 100) * 100, 100);
  } else {
    return Math.min(Math.ceil(weight / 100) * 100, 900);
  }
}

function getFontResFolderPath(rootPath: string) {
  return path.join(rootPath, 'app/src/main/res/font');
}

function getXMLFontId(fontFileName: string) {
  return `@font/${path.basename(fontFileName, path.extname(fontFileName))}`;
}

function buildXMLFontObjectEntry(fontFile: FontFamilyFile): FontXMLEntry {
  return {
    '@_app:fontStyle': fontFile.isItalic ? 'italic' : 'normal',
    '@_app:fontWeight': fontFile.weight,
    '@_app:font': getXMLFontId(fontFile.name),
  };
}

function buildXMLFontObject(fontFiles: FontFamilyFile[]): FontXMLObject {
  const fonts: FontXMLEntry[] = [];
  fontFiles.forEach((fontFile) => {
    const xmlEntry = buildXMLFontObjectEntry(fontFile);

    // We can't have style / weight duplicates.
    const foundEntryIndex = fonts.findIndex(
      (font) =>
        font['@_app:fontStyle'] === xmlEntry['@_app:fontStyle'] &&
        font['@_app:fontWeight'] === xmlEntry['@_app:fontWeight'],
    );

    if (foundEntryIndex === -1) {
      fonts.push(xmlEntry);
    } else {
      fonts[foundEntryIndex] = xmlEntry;
    }
  });

  return {
    '?xml': {
      '@_version': '1.0',
      '@_encoding': 'utf-8',
    },
    'font-family': {
      '@_xmlns:app': 'http://schemas.android.com/apk/res-auto',
      font: fonts,
    },
  };
}

function getAddCustomFontMethodCall(
  fontName: string,
  fontId: string,
  isKotlin?: boolean,
) {
  return `ReactFontManager.getInstance().addCustomFont(this, "${fontName}", R.font.${fontId})${
    isKotlin ? '' : ';'
  }`;
}

function addImportToFile(
  fileData: string,
  importToAdd: string,
  isKotlin?: boolean,
) {
  const importRegex = new RegExp(
    `import\\s+${importToAdd}${isKotlin ? '' : ';'}`,
    'gm',
  );
  const existingImport = importRegex.exec(fileData);

  if (existingImport) {
    return fileData;
  }

  const packageRegex = isKotlin ? /package\s+[\w.]+/ : /package\s+[\w.]+;/;
  const packageMatch = packageRegex.exec(fileData);

  if (packageMatch) {
    return fileData.replace(
      packageMatch[0],
      `${packageMatch[0]}\n\nimport ${importToAdd}`,
    );
  }

  return fileData;
}

function insertLineInClassMethod(
  fileData: string,
  targetClass: string,
  targetMethod: string,
  codeToInsert: string,
  lineToInsertAfter?: string,
  isKotlin?: boolean,
) {
  const classRegex = new RegExp(
    isKotlin
      ? `class\\s+${targetClass}\\s*:\\s*\\S+\\(\\)\\s*,?\\s*(\\S+\\s*)?\\{`
      : `class\\s+${targetClass}(\\s+extends\\s+\\S+)?(\\s+implements\\s+\\S+)?\\s*\\{`,
    'gm',
  );
  const classMatch = classRegex.exec(fileData);

  if (!classMatch) {
    logger.error(`Class ${targetClass} not found.`);
    return fileData;
  }

  const methodRegex = new RegExp(
    isKotlin
      ? `override\\s+fun\\s+${targetMethod}\\s*\\(\\)`
      : `(public|protected|private)\\s+(static\\s+)?\\S+\\s+${targetMethod}\\s*\\(`,
    'gm',
  );
  let methodMatch = methodRegex.exec(fileData);

  while (methodMatch) {
    if (methodMatch.index > classMatch.index) {
      break;
    }
    methodMatch = methodRegex.exec(fileData);
  }

  if (!methodMatch) {
    logger.error(`Method ${targetMethod} not found in class ${targetClass}.`);
    return fileData;
  }

  const openingBraceIndex = fileData.indexOf('{', methodMatch.index);
  let closingBraceIndex = -1;
  let braceCount = 1;

  for (let i = openingBraceIndex + 1; i < fileData.length; i += 1) {
    if (fileData[i] === '{') {
      braceCount += 1;
    } else if (fileData[i] === '}') {
      braceCount -= 1;
    }

    if (braceCount === 0) {
      closingBraceIndex = i;
      break;
    }
  }

  if (closingBraceIndex === -1) {
    logger.error(
      `Could not find closing brace for method ${targetMethod} in class ${targetClass}.`,
    );
    return fileData;
  }

  const methodBody = fileData.slice(openingBraceIndex + 1, closingBraceIndex);

  if (methodBody.includes(codeToInsert.trim())) {
    return fileData;
  }

  let insertPosition = closingBraceIndex;

  if (lineToInsertAfter) {
    const lineIndex = methodBody.indexOf(lineToInsertAfter.trim());
    if (lineIndex !== -1) {
      insertPosition =
        openingBraceIndex + 1 + lineIndex + lineToInsertAfter.trim().length;
    } else {
      logger.error(
        `Line "${lineToInsertAfter}" not found in method ${targetMethod} of class ${targetClass}.`,
      );
      return fileData;
    }
  }

  return `${fileData.slice(
    0,
    insertPosition,
  )}\n    ${codeToInsert}${fileData.slice(insertPosition)}`;
}

function removeLineFromFile(fileData: string, stringToRemove: string) {
  const lines = fileData.split('\n');
  const updatedLines = lines.filter((line) => !line.includes(stringToRemove));
  return updatedLines.join('\n');
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  isArray: (tagName) => tagName === 'font',
});

const xmlBuilder = new XMLBuilder({
  format: true,
  ignoreAttributes: false,
  suppressEmptyNode: true,
});

export {
  FontFamilyEntry,
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
  removeLineFromFile,
  toArrayBuffer,
  xmlBuilder,
  xmlParser,
};
