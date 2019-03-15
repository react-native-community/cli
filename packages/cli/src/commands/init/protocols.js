// @flow
import path from 'path';

const FILE_PROTOCOL = /file:/;

function fixPaths(reactNativePath: string) {
  if (path.isAbsolute(reactNativePath)) {
    return reactNativePath;
  }

  return path.resolve(process.cwd(), '..', reactNativePath);
}

function handleFileProtocol(packageName: string) {
  return fixPaths(packageName.replace(FILE_PROTOCOL, ''));
}

export function supportProtocols(packageName: string, defaultPackage?: string) {
  if (packageName.match(FILE_PROTOCOL)) {
    return handleFileProtocol(packageName);
  }

  return defaultPackage || packageName;
}
