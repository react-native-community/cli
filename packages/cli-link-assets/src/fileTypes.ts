import path from 'path';

const fontTypes = ['otf', 'ttf'] as const;

const imageTypes = ['png', 'jpg', 'gif'] as const;

const audioTypes = ['mp3'] as const;

/**
 * Returns the extension of an asset, without the leading dot and lower-cased.
 *
 * The known asset types above are all spelled in lower case, while the
 * extension on disk can be cased in any way (`Lato-Regular.TTF`), so it has to
 * be normalized before it is matched against them.
 */
function getAssetExtension(filePath: string) {
  return path.extname(filePath).substring(1).toLowerCase();
}

export {fontTypes, imageTypes, audioTypes, getAssetExtension};
