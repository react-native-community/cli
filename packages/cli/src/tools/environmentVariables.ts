import {executeCommand} from './executeWinCommand';

/**
 * Creates a new variable in the user's environment
 */
const setEnvironment = async (variable: string, value: string) => {
  // https://superuser.com/a/601034
  const command = `setx ${variable} "${value}"`;
  return executeCommand(command);
};

/**
 * Prepends the given `value` to the user's environment `variable`.
 * @param {string} variable The environment variable to modify
 * @param {string} value The value to add to the variable
 * @returns {Promise<void>}
 */
const updateEnvironment = (variable: string, value: string) => {
  // https://superuser.com/a/601034
  const command = `for /f "skip=2 tokens=3*" %a in ('reg query HKCU\\Environment /v ${variable}') do @if [%b]==[] ( @setx ${variable} "${value};%~a" ) else ( @setx ${variable} "${value};%~a %~b" )
  `;

  return executeCommand(command);
};

export {setEnvironment, updateEnvironment};
