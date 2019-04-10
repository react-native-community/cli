/**
 * @flow
 */
import dedent from 'dedent';

/**
 * CLIError
 *
 * Features:
 * - uses original stack trace when error object is passed
 * - makes an inline string to match current styling inside CLI
 */
export class CLIError extends Error {
  constructor(msg: string, error?: Error) {
    super(dedent(msg).replace(/(\r\n|\n|\r)/gm, ' '));
    if (error) {
      this.stack = error.stack
        .split('\n')
        .slice(0, 2)
        .join('\n');
    } else {
      Error.captureStackTrace(this, CLIError);
    }
  }
}
