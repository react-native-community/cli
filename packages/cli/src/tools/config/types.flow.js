/**
 * @flow
 */

type InquirerPromptT = any;

type DependencyParamsAndroidT = {
  sourceDir?: string,
  manifestPath?: string,
  packageImportPath?: string,
  packageInstance?: string,
};

type ProjectParamsAndroidT = {
  sourceDir?: string,
  manifestPath?: string,
  packageName?: string,
  packageFolder?: string,
  mainFilePath?: string,
  stringsPath?: string,
  settingsGradlePath?: string,
  assetsPath?: string,
  buildGradlePath?: string,
};

type ProjectParamsIOST = {
  project?: string,
  sharedLibraries?: string[],
  libraryFolder?: string,
};

export type ConfigT = {|
  root: string,
  reactNativePath: string,
  project: {
    android: ?ProjectConfigAndroidT,
    ios: ?ProjectConfigIOST,
    [key: string]: any,
  },
  assets: string[],
  dependencies: {
    [key: string]: {
      name: string,
      platforms: {
        android?: DependencyConfigAndroidT | null,
        ios?: DependencyConfigIOST | null,
        [key: string]: any,
      },
      assets: string[],
      hooks: {
        [key: string]: string,
        prelink?: string,
        postlink?: string,
      },
      params: InquirerPromptT[],
    },
  },
  platforms: {
    [name: string]: any,
    ios: {
      projectConfig: (string, ProjectParamsIOST) => ?ProjectConfigIOST,
      dependencyConfig: (string, ProjectParamsIOST) => ?DependencyConfigIOST,
      linkConfig: () => {
        isInstalled: (
          ProjectConfigIOST,
          string,
          DependencyConfigIOST,
        ) => boolean,
        register: (
          string,
          DependencyConfigIOST,
          Object,
          ProjectConfigIOST,
        ) => void,
        unregister: (
          string,
          DependencyConfigT,
          ProjectConfigIOST,
          Array<DependencyConfigT>,
        ) => void,
        copyAssets: (string[], ProjectConfigIOST) => void,
        unlinkAssets: (string[], ProjectConfigIOST) => void,
      },
      android: {
        projectConfig: (
          string,
          ProjectParamsAndroidT,
        ) => ?ProjectConfigAndroidT,
        dependencyConfig: (
          string,
          DependencyParamsAndroidT,
        ) => ?DependencyConfigAndroidT,
        linkConfig: () => {
          isInstalled: (
            ProjectConfigAndroidT,
            string,
            DependencyConfigIOST,
          ) => boolean,
          register: (
            string,
            DependencyConfigIOST,
            Object,
            ProjectConfigAndroidT,
          ) => void,
          unregister: (
            string,
            DependencyConfigT,
            ProjectConfigAndroidT,
            Array<DependencyConfigT>,
          ) => void,
          copyAssets: (string[], ProjectConfigIOST) => void,
          unlinkAssets: (string[], ProjectConfigIOST) => void,
        },
      },
    },
  },
  commands: string[],
  haste: {
    platforms: Array<string>,
    providesModuleNodeModules: Array<string>,
  },
|};

export type DependencyConfigT = $PropertyType<
  $PropertyType<ConfigT, 'dependencies'>,
  '[key: string]',
>;

export type HooksT = $PropertyType<DependencyConfigT, 'hooks'>;

export type ProjectConfigT = $PropertyType<ConfigT, 'project'>;

export type PlatformsT = $PropertyType<ConfigT, 'platforms'>;

export type UserDependencyConfigT = {
  dependency: {
    platforms: {
      android: DependencyParamsAndroidT,
      ios: ProjectParamsIOST,
      [key: string]: any,
    },
    assets: string[],
    hooks: HooksT,
    params: InquirerPromptT[],
  },
  commands: string[],
  platforms: {
    [name: string]: any,
  },
};

export type UserConfigT = {
  ...$Diff<ConfigT, {haste: any, root: any, platforms: any}>,
  reactNativePath: ?string,
  project: {
    android?: ProjectParamsAndroidT,
    ios?: ProjectParamsIOST,
    [key: string]: any,
  },
};

type ProjectConfigIOST = {};

type DependencyConfigIOST = ProjectConfigIOST;

type ProjectConfigAndroidT = {};

type DependencyConfigAndroidT = {};
