import fs from 'fs';
import plistParser, {PlistObject} from 'plist';
import {XcodeProject} from 'xcode';
import getPlistPath from './getPlistPath';

type Writeable<T> = {-readonly [P in keyof T]: T[P]};

/**
 * Returns Info.plist located in the iOS project
 *
 * Returns `null` if INFOPLIST_FILE is not specified.
 */
function getPlist(project: XcodeProject, sourceDir: string) {
  const plistPath = getPlistPath(project, sourceDir);

  if (!plistPath || !fs.existsSync(plistPath)) {
    return null;
  }

  return plistParser.parse(
    fs.readFileSync(plistPath, 'utf-8'),
  ) as Writeable<PlistObject>;
}

export default getPlist;
