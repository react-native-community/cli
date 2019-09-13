export default class DirectoryAlreadyExistsError extends Error {
  constructor(directory: string) {
    super(
      `Cannot initialize new project because directory "${directory}" already exists.`,
    );
  }
}
