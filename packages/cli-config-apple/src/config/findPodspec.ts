import glob from 'tinyglobby';
import path from 'path';
import {unixifyPaths} from '@react-native-community/cli-tools';

export default function findPodspec(folder: string): string | null {
  const podspecs = glob.globSync('*.podspec', {
    cwd: unixifyPaths(folder),
    expandDirectories: false,
  });

  if (podspecs.length === 0) {
    return null;
  }

  const packagePodspec = path.basename(folder) + '.podspec';
  const podspecFile = podspecs.includes(packagePodspec)
    ? packagePodspec
    : podspecs[0];

  return path.join(folder, podspecFile);
}
