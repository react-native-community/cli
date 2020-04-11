export default class VersionAndDevVersionSetError extends Error {
  constructor() {
    super('Cannot set --version and --dev-version at the same time.');
  }
}
