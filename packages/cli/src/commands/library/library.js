/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import fs from 'fs';
import path from 'path';
import copyAndReplace from '../../tools/copyAndReplace';
import isValidPackageName from '../../tools/isValidPackageName';
import walk from '../../tools/walk';
import {logger} from '@react-native-community/cli-tools';

/**
 * Creates a new native library with the given name
 */
async function library(argv, ctx, args) {
  if (!isValidPackageName(args.name)) {
    throw new Error(
      `${args.name} is not a valid name for a project. Please use a valid ` +
        'identifier name (alphanumeric).',
    );
  }

  const libraries = path.resolve(ctx.root, 'Libraries');
  const libraryDest = path.resolve(libraries, args.name);
  const source = path.resolve(
    'node_modules',
    'react-native',
    'Libraries',
    'Sample',
  );

  if (!fs.existsSync(libraries)) {
    fs.mkdirSync(libraries);
  }

  if (fs.existsSync(libraryDest)) {
    throw new Error(`Library already exists in ${libraryDest}`);
  }

  walk(source).forEach(f => {
    if (
      f.indexOf('project.xcworkspace') !== -1 ||
      f.indexOf('.xcodeproj/xcuserdata') !== -1
    ) {
      return;
    }

    const dest = path.relative(
      source,
      f.replace(/Sample/g, args.name).replace(/^_/, '.'),
    );
    copyAndReplace(path.resolve(source, f), path.resolve(libraryDest, dest), {
      Sample: args.name,
    });
  });

  logger.info(`Created library in ${libraryDest}.
Now it needs to be linked in Xcode:
https://facebook.github.io/react-native/docs/linking-libraries-ios.html#content`);
}

export default {
  name: 'new-library',
  func: library,
  description: 'generates a native library bridge',
  options: [
    {
      command: '--name <string>',
      description: 'name of the library to generate',
      default: null,
    },
  ],
};
