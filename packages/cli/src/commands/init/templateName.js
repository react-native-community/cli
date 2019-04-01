// @flow
import path from 'path';
import {URL} from 'url';
import {fetch} from '../../tools/fetch';

const FILE_PROTOCOL = /file:/;

function handleFileProtocol(filePath: string) {
  const uri = new URL(filePath).pathname;

  return {
    uri,
    name: require(path.join(uri, 'package.json')).name,
  };
}

export function processTemplateName(templateName: string) {
  if (templateName.match(FILE_PROTOCOL)) {
    return handleFileProtocol(templateName);
  }

  return {
    uri: templateName,
    name: templateName,
  };
}

/**
 * `init` may be invoked with a shorthand like `--template typescript`
 * which should resolve to `react-native-template-typescript` package.
 * To support that, we query npm registry if a package like this exists, if not
 * we return the original name without a change.
 */
export async function tryTemplateShorthand(maybeTemplateShorthand: string) {
  try {
    const reactNativeTemplatePackage = `react-native-template-${maybeTemplateShorthand}`;
    const response = await fetch(
      `https://registry.yarnpkg.com/${reactNativeTemplatePackage}/latest`,
    );

    if (JSON.parse(response).name) {
      return reactNativeTemplatePackage;
    }
  } catch (e) {
    // we expect this to fail when `file://` protocol or regular module is passed
  }
  return maybeTemplateShorthand;
}
