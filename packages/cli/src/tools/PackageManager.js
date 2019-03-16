// @flow
import {execSync} from 'child_process';
import yarn from './yarn';

type PackageManagerOptions = {
  forceNpm?: boolean,
  projectDir: string,
};

export default class PackageManager {
  options: PackageManagerOptions;

  constructor(options: PackageManagerOptions) {
    this.options = options;
  }

  executeCommand(command: string, options?: {silent: boolean}) {
    return execSync(command, {
      stdio: options && options.silent ? 'pipe' : 'inherit',
    });
  }

  shouldCallYarn() {
    return (
      !this.options.forceNpm &&
      yarn.getYarnVersionIfAvailable() &&
      yarn.isGlobalCliUsingYarn(this.options.projectDir)
    );
  }

  install(packageNames: Array<string>, options?: {silent: boolean}) {
    return this.shouldCallYarn()
      ? this.executeCommand(`yarn add ${packageNames.join(' ')}`, options)
      : this.executeCommand(
          `npm install ${packageNames.join(' ')} --save --save-exact`,
          options,
        );
  }

  installDev(packageNames: Array<string>) {
    return this.shouldCallYarn()
      ? this.executeCommand(`yarn add -D ${packageNames.join(' ')}`)
      : this.executeCommand(
          `npm install ${packageNames.join(' ')} --save-dev --save-exact`,
        );
  }

  uninstall(packageNames: Array<string>) {
    return this.shouldCallYarn()
      ? this.executeCommand(`yarn remove ${packageNames.join(' ')}`)
      : this.executeCommand(`npm uninstall ${packageNames.join(' ')} --save`);
  }
}
