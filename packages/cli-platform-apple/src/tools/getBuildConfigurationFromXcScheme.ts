import {CLIError} from '@react-native-community/cli-tools';
import pico from 'picocolors';
import {XMLParser} from 'fast-xml-parser';
import fs from 'fs';
import path from 'path';
import {IosInfo} from '../types';

const xmlParser = new XMLParser({ignoreAttributes: false});

export function getBuildConfigurationFromXcScheme(
  scheme: string,
  configuration: string,
  sourceDir: string,
  projectInfo: IosInfo | undefined,
): string {
  // can not assume .xcodeproj exists.
  // for more info see: https://github.com/react-native-community/cli/pull/2196
  try {
    const xcProject = fs
      .readdirSync(sourceDir)
      .find((dir) => dir.endsWith('.xcodeproj'));

    if (xcProject) {
      const xmlScheme = fs.readFileSync(
        path.join(
          sourceDir,
          xcProject,
          'xcshareddata',
          'xcschemes',
          `${scheme}.xcscheme`,
        ),
        {
          encoding: 'utf-8',
        },
      );

      const {Scheme} = xmlParser.parse(xmlScheme);

      return Scheme.LaunchAction['@_buildConfiguration'];
    }
  } catch {
    const projectSchemes =
      projectInfo?.schemes && projectInfo.schemes.length > 0
        ? `${projectInfo.schemes.map((name) => pico.bold(name)).join(', ')}`
        : 'No schemes';

    throw new CLIError(
      `Could not load the shared scheme for ${scheme}. Your project configuration includes: ${projectSchemes}. Please ensure a valid .xcscheme file exists in xcshareddata/xcschemes.`,
    );
  }

  return configuration;
}
