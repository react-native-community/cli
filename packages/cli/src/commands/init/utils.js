// @flow
import fs from 'fs-extra';
import path from 'path';

const FILE_PROTOCOL = /file:/;

export function getTemplateName(): string {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'app.json'), 'utf8'),
    ).templateName;
  } catch (e) {
    throw new Error('Cannot retrieve templateName');
  }
}

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
