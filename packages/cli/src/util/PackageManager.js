// @flow
import { execSync } from 'child_process';
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

  executeCommand(command: string) {
    return execSync(command, { stdio: 'inherit' });
  }

  shouldCallYarn() {
    return (
      !this.options.forceNpm &&
      yarn.getYarnVersionIfAvailable() &&
      yarn.isGlobalCliUsingYarn(this.options.projectDir)
    );
  }

  install(packageNames: Array<string>) {
    return this.shouldCallYarn()
      ? this.executeCommand(`yarn add ${packageNames.join(' ')}`)
      : this.executeCommand(
          `npm install ${packageNames.join(' ')} --save --save-exact`
        );
  }

  installDev(packageNames: Array<string>) {
    return this.shouldCallYarn()
      ? this.executeCommand(`yarn add -D ${packageNames.join(' ')}`)
      : this.executeCommand(
          `npm install ${packageNames.join(' ')} --save-dev --save-exact`
        );
  }

  uninstall(packageNames: Array<string>) {
    return this.shouldCallYarn()
      ? this.executeCommand(`yarn remove ${packageNames.join(' ')}`)
      : this.executeCommand(`npm uninstall ${packageNames.join(' ')} --save`);
  }
}
