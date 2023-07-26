import fs from 'fs';
import {PACKAGE_MANAGER} from './types';

export default function getProjectPM(): PACKAGE_MANAGER | undefined {
  if (fs.existsSync('yarn.lock')) {
    return PACKAGE_MANAGER.YARN;
  }

  if (fs.existsSync('package-lock.json')) {
    return PACKAGE_MANAGER.NPM;
  }

  return undefined;
}
