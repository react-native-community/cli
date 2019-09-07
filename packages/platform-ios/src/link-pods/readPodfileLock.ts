import fs from 'fs';
import {logger} from '@react-native-community/cli-tools';

export default function readPodfileLock(podfileLockPath: string) {
  logger.debug(`Reading ${podfileLockPath}`);
  const podLockContent = fs.readFileSync(podfileLockPath, 'utf8');
  return podLockContent.split(/\r?\n/g);
}
