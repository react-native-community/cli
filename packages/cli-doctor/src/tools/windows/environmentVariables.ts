import {executeCommand} from './executeWinCommand';

/**
 * Creates a new variable in the user's environment
 */
const setEnvironment = async (variable: string, value: string) => {
  // https://superuser.com/a/601034
  const command = `setx ${variable} "${value}"`;

  await executeCommand(command);

  process.env[variable] = value;
};

/**
 * Prepends the given `value` to the user's environment `variable`.
 * @param {string} variable The environment variable to modify
 * @param {string} value The value to add to the variable
 * @returns {Promise<void>}
 */
const updateEnvironment = async (variable: string, value: string) => {
  // Avoid adding the value multiple times to PATH
  // Need to do the following to avoid TSLint complaining about possible
  // undefined values even if I check before via `typeof` or another way
  const envVariable = process.env[variable] || '';
  if (variable === 'PATH' && envVariable.includes(`${value};`)) {
    return;
  }
  // https://superuser.com/a/601034
  const command = `for /f "skip=2 tokens=3*" %a in ('reg query HKCU\\Environment /v ${variable}') do @if [%b]==[] ( @setx ${variable} "${value};%~a" ) else ( @setx ${variable} "${value};%~a %~b" )
  `;

  await executeCommand(command);

  process.env[variable] = `${process.env[variable]}${value};`;
};

export {setEnvironment, updateEnvironment};
