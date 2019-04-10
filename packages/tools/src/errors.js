/**
 * @flow
 */

/**
 * CLIError
 *
 * Features:
 * - uses original stack trace when error object is passed
 * - makes an inline string to match current styling inside CLI
 */
export class CLIError extends Error {
  constructor(msg: string, originError?: Error | string) {
    super(inlineString(msg));
    if (originError) {
      this.stack =
        typeof originError === 'string'
          ? originError
          : originError.stack
              .split('\n')
              .slice(0, 2)
              .join('\n');
    } else {
      Error.captureStackTrace(this, CLIError);
    }
  }
}

export const inlineString = (str: string) =>
  str.replace(/(\s{2,})/gm, ' ').trim();
