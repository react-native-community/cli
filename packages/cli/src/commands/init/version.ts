import {logger} from '@react-native-community/cli-tools';
import {getTemplateVersion} from '../../tools/npm';
import semver from 'semver';

import type {Options} from './types';
import {
  TEMPLATE_COMMUNITY_REACT_NATIVE_VERSION,
  TEMPLATE_PACKAGE_COMMUNITY,
  TEMPLATE_PACKAGE_LEGACY,
  TEMPLATE_PACKAGE_LEGACY_TYPESCRIPT,
} from './constants';

export async function createTemplateUri(
  options: Options,
  version: string,
): Promise<string> {
  if (options.platformName && options.platformName !== 'react-native') {
    logger.debug('User has specified an out-of-tree platform, using it');
    return `${options.platformName}@${version}`;
  }

  if (options.template === TEMPLATE_PACKAGE_LEGACY_TYPESCRIPT) {
    logger.warn(
      "Ignoring custom template: 'react-native-template-typescript'. Starting from React Native v0.71 TypeScript is used by default.",
    );
    return TEMPLATE_PACKAGE_LEGACY;
  }

  if (options.template) {
    logger.debug(`Use the user provided --template=${options.template}`);
    return options.template;
  }

  // 0.75.0-nightly-20240618-5df5ed1a8' -> 0.75.0
  // 0.75.0-rc.1 -> 0.75.0
  const simpleVersion = semver.coerce(version) ?? version;

  // Does the react-native@version package *not* have a template embedded. We know that this applies to
  // all version before 0.75. The 1st release candidate is the minimal version that has no template.
  const useLegacyTemplate = semver.lt(
    simpleVersion,
    TEMPLATE_COMMUNITY_REACT_NATIVE_VERSION,
  );

  logger.debug(
    `[template]: is '${version} (${simpleVersion})' < '${TEMPLATE_COMMUNITY_REACT_NATIVE_VERSION}' = ` +
      (useLegacyTemplate
        ? 'yes, look for template in react-native'
        : 'no, look for template in @react-native-community/template'),
  );

  if (!useLegacyTemplate) {
    if (/nightly/.test(version)) {
      logger.debug(
        "[template]: you're using a nightly version of react-native",
      );
      // Template nightly versions and react-native@nightly versions don't match (template releases at a much
      // lower cadence). We have to assume the user is running against the latest nightly by pointing to the tag.
      return `${TEMPLATE_PACKAGE_COMMUNITY}@nightly`;
    }
    const templateVersion = await getTemplateVersion(version);
    return `${TEMPLATE_PACKAGE_COMMUNITY}@${templateVersion}`;
  }

  logger.debug(
    `Using the legacy template because '${TEMPLATE_PACKAGE_LEGACY}' still contains a template folder`,
  );
  return `${TEMPLATE_PACKAGE_LEGACY}@${version}`;
}
