import {writeFileSync} from 'fs';
import {join} from 'path';
import {tmpdir} from 'os';
import {executeCommand} from './executeWinCommand';

type LnkOptions = {
  path: string;
  name: string;
  ico: string;
};

/**
 * Creates a script in the user's Startup menu
 */
export const createShortcut = async ({path, name, ico}: LnkOptions) => {
  // prettier-ignore
  const script =
`option explicit
sub createLnk()
    dim objShell, strStartMenuPath, objLink
    set objShell = CreateObject("WScript.Shell")
    strStartMenuPath = objShell.SpecialFolders("StartMenu")
    set objLink = objShell.CreateShortcut(strStartMenuPath + "\\" + "${name}.lnk")
    objLink.TargetPath = "${path}"
    objLink.IconLocation = "${ico}"
    objLink.Save
end sub

call createLnk()`;

  const scriptPath = join(tmpdir(), `shortcut-${Math.random()}.vbs`);
  writeFileSync(scriptPath, script, 'utf-8');

  await executeCommand(scriptPath);
};
