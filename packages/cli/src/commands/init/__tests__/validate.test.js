// @flow
import {validateProjectName} from '../validate';
import InvalidNameError from '../errors/InvalidNameError';
import ReservedNameError from '../errors/ReservedNameError';

test.each(['projectName', 'ProjectName', 'project_name'])(
  "'%s' project name should be valid",
  (name: string) => {
    expect(() => validateProjectName(name)).not.toThrowError();
  },
);

test.each([
  {
    name: 'project-name',
    error: InvalidNameError,
  },
  {
    name: 'React',
    error: ReservedNameError,
  },
  {
    name: 'react',
    error: ReservedNameError,
  },
])("'%s' is invalid name", ({name, error}: {name: string, error: Error}) => {
  expect(() => validateProjectName(name)).toThrowError(error);
});
