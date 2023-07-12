import {unixifyPaths} from '@react-native-community/cli-tools';
import fg from 'fast-glob';
import path from 'path';

export default function findPodspec(folder: string): string | null {
  const podspecs = fg.sync('*.podspec', {cwd: unixifyPaths(folder)});

  if (podspecs.length === 0) {
    return null;
  }

  const packagePodspec = path.basename(folder) + '.podspec';
  const podspecFile = podspecs.includes(packagePodspec)
    ? packagePodspec
    : podspecs[0];

  return path.join(folder, podspecFile);
}
