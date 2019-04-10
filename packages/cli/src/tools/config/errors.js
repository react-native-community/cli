/**
 * @flow
 */
import {CLIError} from '@react-native-community/cli-tools';

type JoiErrorDetails<K, T> = {
  message: string,
  path: string[],
  type: K,
  context: T,
};

type JoiErrorT = {
  details: Array<
    JoiErrorDetails<
      'object.allowUnknown' | 'object.base' | 'string.base',
      {
        key: string,
        label: string,
        value: Object,
      },
    >,
  >,
};

export class JoiError extends CLIError {
  constructor(joiError: JoiErrorT) {
    super(
      joiError.details
        .map(error => {
          const name = error.path.join('.');
          switch (error.type) {
            case 'object.allowUnknown': {
              const value = JSON.stringify(error.context.value);
              return `
                Unknown option ${name} with value "${value}" was found.
                This is either a typing error or a user mistake. Fixing it will remove this message.
              `;
            }
            case 'object.base':
            case 'string.base': {
              const expectedType = error.type.replace('.base', '');
              const actualType = typeof error.context.value;
              return `
                Option ${name} must be a ${expectedType}, instead got ${actualType}
              `;
            }
            default:
              return error.message;
          }
        })
        .join(),
    );
  }
}
