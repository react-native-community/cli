export default class ReservedNameError extends Error {
  constructor(name: string) {
    super(
      `Not a valid name for a project. Please do not use the reserved word "${name}".`,
    );
  }
}
