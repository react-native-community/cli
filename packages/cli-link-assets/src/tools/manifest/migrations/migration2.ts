import path from 'path';
import {AssetPathAndSHA1} from '..';
import {fontTypes} from '../../../fileTypes';

function migration2(
  assets: string[] | AssetPathAndSHA1[],
  platform: 'android' | 'ios',
): AssetPathAndSHA1[] {
  return (assets as AssetPathAndSHA1[]).map((asset) => ({
    ...asset,
    shouldRelinkAndroidFonts:
      platform === 'android' &&
      fontTypes.includes(
        path.extname(asset.path).substring(1) as (typeof fontTypes)[number],
      ),
  }));
}

export default migration2;
