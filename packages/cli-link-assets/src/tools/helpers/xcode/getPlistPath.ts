import path from 'path';
import {XcodeProject} from 'xcode';
import getBuildProperty from './getBuildProperty';

function getPlistPath(project: XcodeProject, sourceDir: string) {
  const plistFile = getBuildProperty(project, 'INFOPLIST_FILE');

  if (typeof plistFile !== 'string') {
    return null;
  }

  return path.join(
    sourceDir,
    plistFile.replace(/"/g, '').replace('$(SRCROOT)', ''),
  );
}

export default getPlistPath;
