// @flow
import path from 'path';

const FILE_PROTOCOL = /file:/;

function fixPaths(reactNativePath: string) {
  if (path.isAbsolute(reactNativePath)) {
    return reactNativePath;
  }

  return path.resolve(process.cwd(), '..', reactNativePath);
}

function handleFileProtocol(rawPackageName: string) {
  const packageDir = fixPaths(rawPackageName.replace(FILE_PROTOCOL, ''));

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
