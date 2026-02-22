import {readFile} from 'fs-extra';
import path from 'path';

export default async function getArchitecture(iosSourceDir: string) {
  try {
    const project = await readFile(
      path.join(iosSourceDir, '/Pods/Pods.xcodeproj/project.pbxproj'),
    );

    return project.includes('-DRCT_NEW_ARCH_ENABLED=1');
  } catch {
    return undefined;
  }
}
