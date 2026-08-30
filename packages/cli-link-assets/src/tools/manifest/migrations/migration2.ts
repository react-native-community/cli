import {AssetPathAndSHA1} from '..';
import {fontTypes, getAssetExtension} from '../../../fileTypes';
import {Platform} from '../../linkPlatform';

function migration2(
  assets: string[] | AssetPathAndSHA1[],
  platform: Platform,
): AssetPathAndSHA1[] {
  return (assets as AssetPathAndSHA1[]).map((asset) => ({
    ...asset,
    shouldRelinkAndroidFonts:
      platform === 'android' &&
      fontTypes.includes(
        getAssetExtension(asset.path) as (typeof fontTypes)[number],
      ),
  }));
}

export default migration2;
