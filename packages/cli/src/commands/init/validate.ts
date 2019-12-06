import InvalidNameError from './errors/InvalidNameError';
import ReservedNameError from './errors/ReservedNameError';
import HelloWorldError from './errors/HelloWorldError';

const NAME_REGEX = /^[$A-Z_][0-9A-Z_$]*$/i;

export function validateProjectName(name: string) {
  if (!String(name).match(NAME_REGEX)) {
    throw new InvalidNameError(name);
  }

  if (name === 'React' || name === 'react') {
    throw new ReservedNameError();
  }

  if (name.match(/helloworld/gi)) {
    throw new HelloWorldError();
  }
}
