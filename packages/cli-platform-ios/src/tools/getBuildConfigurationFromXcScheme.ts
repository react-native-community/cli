import {CLIError} from '@react-native-community/cli-tools';
import {XMLParser} from 'fast-xml-parser';
import fs from 'fs';
import path from 'path';

const xmlParser = new XMLParser({ignoreAttributes: false});

export function getBuildConfigurationFromXcScheme(
  scheme: string,
  configuration: string,
  sourceDir: string,
) {
  try {
    const xcProject = fs
      .readdirSync(sourceDir)
      .find((dir) => dir.includes('.xcodeproj'));

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
    throw new CLIError(
      `Could not find scheme ${scheme}. Please make sure the schema you want to run exists.`,
    );
  }

  return configuration;
}
