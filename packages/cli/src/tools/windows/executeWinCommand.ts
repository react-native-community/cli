import {writeFileSync} from 'fs';
import {tmpdir} from 'os';
import {join} from 'path';

import execa from 'execa';

/** Runs a command requestion permission to run elevated. */
const runElevated = (command: string) => {
  // TODO: escape double quotes in args
  // https://www.winhelponline.com/blog/vbscripts-and-uac-elevation/
  /**
   * Need to use a couple of intermediary files to make this work as
   * `ShellExecute` only accepts a command so
   */

  // prettier-ignore
  const script =
`If WScript.Arguments.length = 0 Then
  Set objShell = CreateObject("Shell.Application")
  'Pass a bogus argument, say [ uac]
  objShell.ShellExecute "wscript.exe", Chr(34) & _
    WScript.ScriptFullName & Chr(34) & " uac", "", "runas", 1
Else
  Dim oShell
  Set oShell = WScript.CreateObject ("WSCript.shell")
  oShell.run "${command}"
  Set oShell = Nothing
End If`;

  const elevatedPath = join(tmpdir(), `elevated-${Math.random()}.vbs`);

  writeFileSync(elevatedPath, script, 'utf-8');

  return execa(elevatedPath);
};

/**
 * Groups all string arguments into a single one. E.g.:
 * ```js
 * ['-m', '"Upgrade:', 'to', 'latest', 'version"'] --> ['-m', '"Upgrade: to latest version"']`
 * ```
 * @param args The arguments
 * © webhint project
 * (https://github.com/webhintio/hint/blob/30b8ba74f122d8b66fc5596d788dd1c7738f2d83/release/lib/utils.ts#L82)
 * License: Apache-2
 */
const groupArgs = (args: string[]) => {
  let isStringArgument = false;
  const newArgs = args.reduce((acum: string[], current) => {
    if (isStringArgument) {
      const last = acum[acum.length - 1];

      acum[acum.length - 1] = `${last} ${current}`;

      if (current.endsWith('"')) {
        isStringArgument = false;
      }

      return acum;
    }

    if (current.startsWith('"')) {
      /**
       * Argument is split. I.e.: `['"part1', 'part2"'];`
       */
      if (!current.endsWith('"')) {
        isStringArgument = true;

        acum.push(current);

        return acum;
      }

      /**
       * Argument is surrounded by "" that need to be removed.
       * We just remove all the quotes because we don't escape any in our commands
       */
      acum.push(current.replace(/"/g, ''));

      return acum;
    }

    acum.push(current);

    return acum;
  }, []);

  return newArgs;
};

/**
 * Executes the given `command` on a shell taking care of slicing the parameters
 * if needed.
 */
const executeShellCommand = (command: string, elevated = false) => {
  const args = groupArgs(command.split(' '));
  const program = args.shift()!;

  if (elevated) {
    return runElevated(command);
  }

  return execa(program, args, {shell: true});
};

export {executeShellCommand as executeCommand};
