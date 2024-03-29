import crypto from 'crypto';
import fs from 'fs';

function sha1File(filePath: string): string {
  const hash = crypto.createHash('sha1');
  hash.update(fs.readFileSync(filePath));

  return hash.digest('hex');
}

export default sha1File;
