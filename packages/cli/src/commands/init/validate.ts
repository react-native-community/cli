import InvalidNameError from './errors/InvalidNameError';
import ReservedNameError from './errors/ReservedNameError';
import HelloWorldError from './errors/HelloWorldError';

const NAME_REGEX = /^[$A-Z_][0-9A-Z_$]*$/i;

// ref: https://docs.oracle.com/javase/tutorial/java/nutsandbolts/_keywords.html
const javaKeywords = [
  'abstract',
  'continue',
  'for',
  'new',
  'switch',
  'assert',
  'default',
  'goto',
  'package',
  'synchronized',
  'boolean',
  'do',
  'if',
  'private',
  'this',
  'break',
  'double',
  'implements',
  'protected',
  'throw',
  'byte',
  'else',
  'import',
  'public',
  'throws',
  'case',
  'enum',
  'instanceof',
  'return',
  'transient',
  'catch',
  'extends',
  'int',
  'short',
  'try',
  'char',
  'final',
  'interface',
  'static',
  'void',
  'class',
  'finally',
  'long',
  'strictfp',
  'volatile',
  'const',
  'float',
  'native',
  'super',
  'while',
];

const reservedNames = ['react', 'react-native', ...javaKeywords];

export function validateProjectName(name: string) {
  if (!String(name).match(NAME_REGEX)) {
    throw new InvalidNameError(name);
  }

  const lowerCaseName = name.toLowerCase();
  if (reservedNames.includes(lowerCaseName)) {
    throw new ReservedNameError();
  }

  if (name.match(/helloworld/gi)) {
    throw new HelloWorldError();
  }
}
