// https://gist.github.com/pguillory/729616
function hookStdout(callback) {
  process.stdout.write = (function(write) {
    return function(string) {
      write.apply(process.stdout, arguments);
      callback(string);
    };
  })(process.stdout.write);
}

export default hookStdout;
