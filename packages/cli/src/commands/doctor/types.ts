import {Ora} from 'ora';

export type EnvironmentInfo = {
  System: {
    OS: string;
    CPU: string;
    Memory: string;
    Shell: {
      version: string;
      path: string;
    };
  };
  Binaries: {
    Node: {
      version: string;
      path: string;
    };
    Yarn: {
      version: string;
      path: string;
    };
    npm: {
      version: string;
      path: string;
    };
    Watchman: {
      version: string;
      path: string;
    };
  };
  SDKs: {
    'iOS SDK': {
      Platforms: string[];
    };
    'Android SDK':
      | {
          'API Levels': string[] | 'Not Found';
          'Build Tools': string[] | 'Not Found';
          'System Images': string[] | 'Not Found';
          'Android NDK': string | 'Not Found';
        }
      | 'Not Found';
  };
  IDEs: {
    'Android Studio': string;
    Emacs: {
      version: string;
      path: string;
    };
    Nano: {
      version: string;
      path: string;
    };
    VSCode: {
      version: string;
      path: string;
    };
    Vim: {
      version: string;
      path: string;
    };
    Xcode: {
      version: string;
      path: string;
    };
  };
  Languages: {
    Python:
      | {
          version: string;
          path: string;
        }
      | 'Not Found';
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
  loader: Ora;
  environmentInfo: EnvironmentInfo;
}) => Promise<void> | void;

export type HealthCheckInterface = {
  label: string;
  visible?: boolean | void;
  isRequired?: boolean;
  description?: string;
  getDiagnostics: (
    environmentInfo: EnvironmentInfo,
  ) => Promise<{
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
  version?: 'Not Found' | string;
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
