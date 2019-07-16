// @flow
import InvalidNameError from './errors/InvalidNameError';
import ReservedNameError from './errors/ReservedNameError';

const NAME_REGEX = /^[$A-Z_][0-9A-Z_$]*$/i;

export function validateProjectName(name: string) {
  if (!String(name).match(NAME_REGEX)) {
    throw new InvalidNameError(name);
  }

  if (name.match(/helloworld|react/gi)) {
    throw new ReservedNameError();
  }
}
