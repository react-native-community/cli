// @flow
import path from 'path';
import {URL} from 'url';

const FILE_PROTOCOL = /file:/;

function handleFileProtocol(rawPackageName: string) {
  const packageDir = new URL(rawPackageName).pathname;

  return {
    packageDir,
    packageName: require(path.join(packageDir, 'package.json')).name,
  };
}

export function supportProtocols(
  rawPackageName: string,
  defaultPackage?: string,
) {
  if (rawPackageName.match(FILE_PROTOCOL)) {
    return handleFileProtocol(rawPackageName);
  }

  const packageName = defaultPackage || rawPackageName;

  return {
    packageDir: packageName,
    packageName,
  };
}
