// https://gist.github.com/pguillory/729616
function hookStdout(callback: Function) {
  process.stdout.write = ((write: any) => (output: any) => {
    write.apply(process.stdout, arguments);
    callback(output);
  })(process.stdout.write);
}

export default hookStdout;
