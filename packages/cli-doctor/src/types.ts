import type {Config} from '@react-native-community/cli-types';
import type {Spinner} from 'nanospinner';

export type Loader = Spinner;

export type NotFound = 'Not Found';

type AvailableInformation = {
  version: string;
  path: string;
};

type Information = AvailableInformation | NotFound;

export type EnvironmentInfo = {
  System: {
    OS: string;
    CPU: string;
    Memory: string;
    Shell: AvailableInformation;
  };
  Binaries: {
    Node: AvailableInformation;
    Yarn: AvailableInformation;
    npm: AvailableInformation;
    bun: AvailableInformation;
    Watchman: AvailableInformation;
  };
  Managers: {
    CocoaPods: AvailableInformation;
  };
  SDKs: {
    'iOS SDK': {
      Platforms: string[];
    };
    'Android SDK':
      | {
          'API Levels': string[] | NotFound;
          'Build Tools': string[] | NotFound;
          'System Images': string[] | NotFound;
          'Android NDK': string | NotFound;
        }
      | NotFound;
  };
  IDEs: {
    'Android Studio': AvailableInformation | NotFound;
    Emacs: AvailableInformation;
    Nano: AvailableInformation;
    VSCode: AvailableInformation;
    Vim: AvailableInformation;
    Xcode: AvailableInformation;
  };
  Languages: {
    Java: Information;
    Ruby: AvailableInformation;
  };
};

export type HealthCheckCategory = {
  label: string;
  healthchecks: HealthCheckInterface[];
};

export type Healthchecks = {
  common: HealthCheckCategory;
  android: HealthCheckCategory;
  ios?: HealthCheckCategory;
};

export type RunAutomaticFix = (args: {
  loader: Loader;
  logManualInstallation: ({
    healthcheck,
    url,
    command,
    message,
  }: {
    healthcheck?: string;
    url?: string;
    command?: string;
    message?: string;
  }) => void;
  environmentInfo: EnvironmentInfo;
  config?: Config;
}) => Promise<void> | void;

export type HealthCheckInterface = {
  label: string;
  visible?: boolean | void;
  isRequired?: boolean;
  description: string;
  getDiagnostics: (
    environmentInfo: EnvironmentInfo,
    config?: Config,
  ) => Promise<{
    description?: string;
    version?: string;
    versions?: [string];
    versionRange?: string;
    needsToBeFixed: boolean | string;
  }>;
  win32AutomaticFix?: RunAutomaticFix;
  darwinAutomaticFix?: RunAutomaticFix;
  linuxAutomaticFix?: RunAutomaticFix;
  runAutomaticFix: RunAutomaticFix;
};

export type HealthCheckResult = {
  label: string;
  needsToBeFixed: boolean;
  version?: NotFound | string;
  versions?: [string] | string;
  versionRange?: string;
  description: string | undefined;
  runAutomaticFix: RunAutomaticFix;
  isRequired: boolean;
  type?: string;
};

export type HealthCheckCategoryResult = {
  label: string;
  healthchecks: HealthCheckResult[];
};
