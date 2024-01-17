import {AssetPathAndSHA1} from '..';
import migration0 from './migration0';
import migration1 from './migration1';
import migration2 from './migration2';

type MigrationFn = (
  assets: string[] | AssetPathAndSHA1[],
  _platform: 'android' | 'ios',
) => AssetPathAndSHA1[];

const migrations: MigrationFn[] = [migration0, migration1, migration2];

export default migrations;
export type {MigrationFn};
