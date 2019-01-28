/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const fs = jest.requireActual('fs');
const path = jest.requireActual('path');

const manifest = fs.readFileSync(
  path.join(__dirname, './files/AndroidManifest.xml')
);
const mainJavaClass = fs.readFileSync(
  path.join(__dirname, './files/Main.java')
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
                path.join(__dirname, `./files/${classFileName}`)
              ),
            },
          },
        },
      },
    },
  };
}

export const valid = generateValidFileStructure('ReactPackage.java');

export const validKotlin = generateValidFileStructure('ReactPackage.kt');

export const userConfigManifest = {
  src: {
    main: {
      'AndroidManifest.xml': manifest,
      com: {
        some: {
          example: {
            'Main.java': mainJavaClass,
            'ReactPackage.java': fs.readFileSync(
              path.join(__dirname, './files/ReactPackage.java')
            ),
          },
        },
      },
    },
    debug: {
      'AndroidManifest.xml': fs.readFileSync(
        path.join(__dirname, './files/AndroidManifest-debug.xml')
      ),
    },
  },
};

export const corrupted = {
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

export const noPackage = {
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
