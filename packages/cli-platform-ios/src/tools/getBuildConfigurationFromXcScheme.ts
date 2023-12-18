import {CLIError} from '@react-native-community/cli-tools';
import chalk from 'chalk';
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
    const availableSchemas =
      projectInfo && projectInfo.schemes && projectInfo.schemes.length > 0
        ? `Available schemas are: ${projectInfo.schemes
            .map((name) => chalk.bold(name))
            .join(', ')}'`
        : '';

    throw new CLIError(
      `Could not find scheme ${scheme}. Please make sure the schema you want to run exists. ${availableSchemas}`,
    );
  }

  return configuration;
}
