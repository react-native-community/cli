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
const buildGradle = fs.readFileSync(
  path.join(__dirname, './files/build.gradle'),
);
const appBuildGradle = fs.readFileSync(
  path.join(__dirname, './files/appbuild.gradle'),
);

const fewActivitiesManifest = fs.readFileSync(
  path.join(__dirname, './files/AndroidManifest-few-activities.xml'),
);

const classNameManifest = fs.readFileSync(
  path.join(__dirname, './files/AndroidManifest-className.xml'),
);

function generateValidFileStructureForLib(classFileName: string) {
  return {
    'build.gradle': buildGradle,
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

function generateValidFileStructureForApp() {
  return {
    'build.gradle': buildGradle,
    app: {
      'build.gradle': appBuildGradle,
    },
    src: {
      'AndroidManifest.xml': manifest,
    },
  };
}

export const valid = generateValidFileStructureForLib('ReactPackage.java');

export const validKotlin = generateValidFileStructureForLib('ReactPackage.kt');

export const validApp = generateValidFileStructureForApp();

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

export const fewActivities = {
  src: {
    'AndroidManifest.xml': fewActivitiesManifest,
  },
};

export const className = {
  src: {
    'AndroidManifest.xml': classNameManifest,
  },
};
