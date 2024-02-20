import fs from 'fs-extra';
import path from 'path';
import migrations from './migrations';

type Manifest = {
  read: () => AssetPathAndSHA1[];
  write: (data: AssetPathAndSHA1[]) => void;
};

type ManifestFile = {
  migIndex: number;
  data: AssetPathAndSHA1[];
};

type AssetPathAndSHA1 = {
  path: string;
  sha1: string;
  shouldRelinkAndroidFonts?: boolean;
};

const migrationsLength = migrations.length;

function readManifest(folderPath: string): ManifestFile {
  return fs.readJsonSync(path.resolve(folderPath, 'link-assets-manifest.json'));
}

function writeManifest(folderPath: string, data: ManifestFile) {
  return fs.writeJsonSync(
    path.resolve(folderPath, 'link-assets-manifest.json'),
    data,
    {
      spaces: 2,
    },
  );
}

const getManifest = (
  folderPath: string,
  platform: 'android' | 'ios',
): Manifest => ({
  read: (): AssetPathAndSHA1[] => {
    const initialData = readManifest(folderPath);

    const newManifest = migrations
      .filter((_, i) => i > (initialData.migIndex || -1))
      .reduce(
        (currData, mig, i) => ({
          migIndex: i,
          data: mig(currData.data || currData, platform),
        }),
        initialData,
      );

    return newManifest.data;
  },
  write: (data: AssetPathAndSHA1[]) => {
    writeManifest(folderPath, {migIndex: migrationsLength - 1, data});
  },
});

export default getManifest;
export {Manifest, ManifestFile, AssetPathAndSHA1};
