// @flow
import Ora from 'ora';

export type EnvironmentInfo = {
  System: {
    OS: string,
    CPU: string,
    Memory: string,
    Shell: {
      version: string,
      path: string,
    },
  },
  Binaries: {
    Node: {
      version: string,
      path: string,
    },
    Yarn: {
      version: string,
      path: string,
    },
    npm: {
      version: string,
      path: string,
    },
    Watchman: {
      version: string,
      path: string,
    },
  },
  SDKs: {
    'iOS SDK': {
      Platforms: string[],
    },
    'Android SDK': {
      'API Levels': string[],
      'Build Tools': string[],
      'System Images': string[],
      'Android NDK': string,
    },
  },
  IDEs: {
    'Android Studio': string,
    Emacs: {
      version: string,
      path: string,
    },
    Nano: {
      version: string,
      path: string,
    },
    VSCode: {
      version: string,
      path: string,
    },
    Vim: {
      version: string,
      path: string,
    },
    Xcode: {
      version: string,
      path: string,
    },
  },
};

export type HealthCheckInterface = {
  label: string,
  visible?: boolean | void,
  isRequired?: boolean,
  getDiagnostics: (
    environmentInfo: EnvironmentInfo,
  ) => Promise<{version?: string, needsToBeFixed: boolean | string}>,
  runAutomaticFix: (args: {
    loader: typeof Ora,
    environmentInfo: EnvironmentInfo,
  }) => Promise<void> | void,
};
