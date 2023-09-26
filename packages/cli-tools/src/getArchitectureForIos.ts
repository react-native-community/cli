import {readFile} from 'fs-extra';
import path from 'path';

export default async function getArchitectureForIos(iosSourceDir: string) {
  try {
    const podfile = await readFile(
      path.join(iosSourceDir, '/Podfile.lock'),
      'utf8',
    );

    return podfile.includes('hermes-engine');
  } catch {
    return false;
  }
}
