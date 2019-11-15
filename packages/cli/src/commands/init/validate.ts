import ReservedNameError from './errors/ReservedNameError';
import HelloWorldError from './errors/HelloWorldError';

export function validateProjectName(name: string) {
  if (name === 'React' || name === 'react') {
    throw new ReservedNameError();
  }

  if (name.match(/helloworld/gi)) {
    throw new HelloWorldError();
  }
}
