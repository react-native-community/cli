import {CLIError} from '@react-native-community/cli-tools';
import {ValidationError} from 'joi';

export class JoiError extends CLIError {
  constructor(joiError: ValidationError) {
    const message = joiError.details
      .map(error => {
        const name = error.path.join('.');
        switch (error.type) {
          case 'object.allowUnknown': {
            const value = JSON.stringify(error.context && error.context.value);
            return `
              Unknown option ${name} with value "${value}" was found.
              This is either a typing error or a user mistake. Fixing it will remove this message.
            `;
          }
          default:
            return error.message;
        }
      })
      .join()
      .trim();

    super(message);
    this.name = 'Config Validation Error';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, JoiError);
    }
  }
}
