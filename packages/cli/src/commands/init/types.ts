import type {PackageManager} from '../../tools/packageManager';

export type Options = {
  template?: string;
  npm?: boolean;
  pm?: PackageManager;
  directory?: string;
  displayName?: string;
  title?: string;
  skipInstall?: boolean;
  version: string;
  packageName?: string;
  installPods?: string | boolean;
  platformName?: string;
  skipGitInit?: boolean;
  replaceDirectory?: string | boolean;
  yarnConfigOptions?: Record<string, string>;
};
