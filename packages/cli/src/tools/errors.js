/**
 * @flow
 */
import chalk from 'chalk';
import dedent from 'dedent';

export class ProcessError extends Error {
  constructor(msg: string, processError: string) {
    super(`${chalk.red(msg)}\n\n${chalk.gray(processError)}`);
    Error.captureStackTrace(this, ProcessError);
  }
}

type JoiErrorT = {
  details: Array<{
    message: string,
    path: string[],
    type: string,
    context: {
      key: string,
      label: string,
      value: Object,
    },
  }>,
};

export class JoiError extends Error {
  constructor(joiError: JoiErrorT) {
    super(
      joiError.details
        .map(error => {
          const name = error.path.join('.');
          const value = JSON.stringify(error.context.value);
          switch (error.type) {
            case 'object.allowUnknown':
              return dedent`
                Unknown option ${name} with value "${value}" was found.
                This is either a typing error or a user mistake. Fixing it will remove this message.
              `;
            case 'object.base':
            case 'string.base':
              const expectedType = error.type.replace('.base', '');
              const actualType = typeof error.context.value;
              return dedent`
                Option ${name} must be a ${expectedType}, instead got ${actualType}
              `;
            default:
              return error.message;
          }
        })
        .join(),
    );
  }
}
