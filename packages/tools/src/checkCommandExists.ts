import {execSync} from 'child_process';

function commandExistsUnixSync(commandName: string) {
  try {
    const stdout = execSync(
      `command -v ${commandName} 2>/dev/null` +
        ` && { echo >&1 '${commandName} found'; exit 0; }`,
    );
    return !!stdout;
  } catch (error) {
    return false;
  }
}

function commandExistsWindowsSync(commandName: string) {
  if (/[\x00-\x1f<>:"\|\?\*]/.test(commandName)) {
    return false;
  }
  try {
    const stdout = execSync('where ' + commandName, {stdio: []});
    return !!stdout;
  } catch (error) {
    return false;
  }
}

function checkCommandExists(commandName: string) {
  if (!commandName) {
    return false;
  }
  switch (process.platform) {
    case 'win32':
      return commandExistsWindowsSync(commandName);
    case 'darwin':
    case 'linux':
      return commandExistsUnixSync(commandName);
    default:
      return false;
  }
}

export default checkCommandExists;
