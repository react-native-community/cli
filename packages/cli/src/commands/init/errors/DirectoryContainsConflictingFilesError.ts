import fs from 'fs';
import path from 'path';

export default class DirectoryContainsConflictingFilesError extends Error {
  constructor(directory: string, conflicts: string[]) {
    let errorString = `The directory ${directory} contains files that could conflict:\n`;

    for (const file of conflicts) {
      try {
        const stats = fs.lstatSync(path.join(directory, file));
        errorString += `  ${file}${stats.isDirectory() ? '/' : ''}`;
      } catch (e) {
        errorString += `  ${file}`;
      }
    }
    errorString +=
      '\nEither try using a new directory name, or remove the files listed above.';

    super(errorString);
  }
}
