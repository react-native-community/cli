export default class InvalidNameError extends Error {
  constructor(name: string) {
    super(
      `"${name}" is not a valid name for a project. Please use a valid identifier name (alphanumeric).`,
    );
  }
}
