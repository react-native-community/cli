import {MigrationFn} from '.';
import {AssetPathAndSHA1} from '..';
import {Platform} from '../../linkPlatform';

const migration1: MigrationFn = (
  assets: string[] | AssetPathAndSHA1[],
  _platform: Platform,
) => {
  return (assets as AssetPathAndSHA1[]).map(({path, sha1}) => ({
    sha1,
    path: `./${path}`, // Doesn't really matter which relative path, will be cleaned anyway
  }));
};

export default migration1;
