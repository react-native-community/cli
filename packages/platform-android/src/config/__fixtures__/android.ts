/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const fs = jest.requireActual('fs');
const path = jest.requireActual('path');

const manifest = fs.readFileSync(
  path.join(__dirname, './files/AndroidManifest.xml'),
);
const mainJavaClass = fs.readFileSync(
  path.join(__dirname, './files/Main.java'),
);

function generateValidFileStructure(classFileName: string) {
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

export const findPackagesClassNameKotlinValid = [
  `
  class SomeExampleKotlinPackage() : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): MutableList<NativeModule> {
        return Collections.emptyList()
    }
    override fun createViewManagers(reactContext: ReactApplicationContext): MutableList<SimpleViewManager<View>> {
       return Collections.emptyList()
    }
  }`,
  `
  class SomeExampleKotlinPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): MutableList<NativeModule> {
        return Collections.emptyList()
    }
    override fun createViewManagers(reactContext: ReactApplicationContext): MutableList<SimpleViewManager<View>> {
       return Collections.emptyList()
    }
  }`,
  `
  class SomeExampleKotlinPackage:ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): MutableList<NativeModule> {
        return Collections.emptyList()
    }
    override fun createViewManagers(reactContext: ReactApplicationContext): MutableList<SimpleViewManager<View>> {
       return Collections.emptyList()
    }
  }`,
  `
  class SomeExampleKotlinPackage
    :
  ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): MutableList<NativeModule> {
        return Collections.emptyList()
    }
    override fun createViewManagers(reactContext: ReactApplicationContext): MutableList<SimpleViewManager<View>> {
       return Collections.emptyList()
    }
  }`,
  `
  class SomeExampleKotlinPackage() : SomeDelegate, OtherDelegate, ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): MutableList<NativeModule> {
        return Collections.emptyList()
    }
    override fun createViewManagers(reactContext: ReactApplicationContext): MutableList<SimpleViewManager<View>> {
       return Collections.emptyList()
    }
  }`,
  `
  class SomeExampleKotlinPackage(val name: String) : SomeDelegate, OtherDelegate, ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): MutableList<NativeModule> {
        return Collections.emptyList()
    }
    override fun createViewManagers(reactContext: ReactApplicationContext): MutableList<SimpleViewManager<View>> {
       return Collections.emptyList()
    }
  }`,
  `
  class SomeExampleKotlinPackage : SomeSuper(), ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): MutableList<NativeModule> {
        return Collections.emptyList()
    }
    override fun createViewManagers(reactContext: ReactApplicationContext): MutableList<SimpleViewManager<View>> {
       return Collections.emptyList()
    }
  }`,
  `
  class SomeExampleKotlinPackage : TurboReactPackage {

  }`,
];

export const findPackagesClassNameKotlinNotValid = [
  `
  class SomeExampleKotlinPackage() {
    override fun createNativeModules(reactContext: ReactApplicationContext): MutableList<NativeModule> {
        return Collections.emptyList()
    }
    override fun createViewManagers(reactContext: ReactApplicationContext): MutableList<SimpleViewManager<View>> {
       return Collections.emptyList()
    }
  }`,
  `
  class SomeExampleKotlinPackage {
    val package: ReactPackage = ReactPackage()
  }`,
  `
  class ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): MutableList<NativeModule> {
        return Collections.emptyList()
    }
    override fun createViewManagers(reactContext: ReactApplicationContext): MutableList<SimpleViewManager<View>> {
       return Collections.emptyList()
    }
  }`,
];

export const findPackagesClassNameJavaValid = [
  `
  class SomeExampleKotlinPackage implements ReactPackage {
    
  }
  `,
  `
  class SomeExampleKotlinPackage implements SomePackage, ReactPackage {
    
  }
  `,
  `
  class SomeExampleKotlinPackage extends SomeSuper implements SomePackage, ReactPackage {
    
  }
  `,
  `
  class SomeExampleKotlinPackage
    implements
    SomePackage,
    ReactPackage {

  }
  `,
  `
  class SomeExampleKotlinPackage extends TurboReactPackage {

  }
  `,
  `
  class SomeExampleKotlinPackage
    extends
    TurboReactPackage {

  }
  `,
  `
  class SomeExampleKotlinPackage
    extends
    TurboReactPackage
    implements
    ReactPackage {

  }
  `,
];

export const findPackagesClassNameJavaNotValid = [
  `
  class SomeExampleKotlinPackage implements SomePackage {
    
  }
  `,
  `
  class ReactPackage {
    
  }
  `,
  `
  class SomeExampleKotlinPackage extends ReactPackage {
    
  }
  `,
  `
  class SomeExampleKotlinPackage {
    
  }
  `,
];
