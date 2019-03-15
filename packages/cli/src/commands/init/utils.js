// @flow
import path from 'path';

const FILE_PROTOCOL = /file:/;

function fixPaths(reactNativePath: string) {
  if (path.isAbsolute(reactNativePath)) {
    return reactNativePath;
  }

  return path.resolve(process.cwd(), '..', reactNativePath);
}

export function getReactNativeVersion(version: string) {
  if (version.match(FILE_PROTOCOL)) {
    return fixPaths(version.replace(FILE_PROTOCOL, ''));
  }

  return `react-native@${version}`;
}
