module.exports = (request, options) => {
  // strip 'node:' prefix from built-in modules
  if (request.startsWith('node:')) {
    return options.defaultResolver(request.slice(5), options);
  }

  return options.defaultResolver(request, options);
};
