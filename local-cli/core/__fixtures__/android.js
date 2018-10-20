/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const fs = require.requireActual('fs');
const path = require.requireActual('path');

const manifest = fs.readFileSync(
  path.join(__dirname, './files/AndroidManifest.xml'),
);
const mainJavaClass = fs.readFileSync(
  path.join(__dirname, './files/Main.java'),
);

function generateValidFileStructure(classFileName) {
  return {
    src: {
      'AndroidManifest.xml': manifest,
      main: {
        com: {
          some: {
            example: {
              'Main.java': mainJavaClass,
              [classFileName]: fs.readFileSync(
                path.join(__dirname, `./files/${classFileName}`),
              ),
            },
          },
        },
      },
    },
  };
}

exports.valid = generateValidFileStructure('ReactPackage.java');

exports.validKotlin = generateValidFileStructure('ReactPackage.kt');

exports.userConfigManifest = {
  src: {
    main: {
      'AndroidManifest.xml': manifest,
      com: {
        some: {
          example: {
            'Main.java': mainJavaClass,
            'ReactPackage.java': fs.readFileSync(
              path.join(__dirname, './files/ReactPackage.java'),
            ),
          },
        },
      },
    },
    debug: {
      'AndroidManifest.xml': fs.readFileSync(
        path.join(__dirname, './files/AndroidManifest-debug.xml'),
      ),
    },
  },
};

exports.corrupted = {
  src: {
    'AndroidManifest.xml': manifest,
    main: {
      com: {
        some: {
          example: {},
        },
      },
    },
  },
};

exports.noPackage = {
  src: {
    'AndroidManifest.xml': manifest,
    main: {
      com: {
        some: {
          example: {
            'Main.java': mainJavaClass,
          },
        },
      },
    },
  },
};
