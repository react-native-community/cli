import {MigrationFn} from '.';
import {AssetPathAndSHA1} from '..';
import sha1File from '../../../sha1File';
import {Platform} from '../../linkPlatform';

const migration0: MigrationFn = (
  assets: string[] | AssetPathAndSHA1[],
  _platform: Platform,
) => {
  const assetsPathsAndSha1: AssetPathAndSHA1[] = [];

  for (const path of assets as string[]) {
    const sha1 = sha1File(path);

    assetsPathsAndSha1.push({
      path,
      sha1,
    });
  }

  return assetsPathsAndSha1;
};

export default migration0;
