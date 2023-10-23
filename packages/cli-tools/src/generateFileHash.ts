import fs from 'fs-extra';
import {createHash} from 'crypto';
import {CLIError} from './errors';

export default function generateFileHash(filePath: string) {
  try {
    const file = fs.readFileSync(filePath, {encoding: 'utf8'});
    const hash = createHash('md5').update(file).digest('hex');

    return hash;
  } catch {
    throw new CLIError('Failed to generate file hash.');
  }
}
