const execa = require('execa');
const chalk = require('chalk');
const path = require('path');
const glob = require('tinyglobby');

const projects = glob.globSync('packages/*/package.json', {
  expandDirectories: false,
});

projects.forEach((project) => {
  const cwd = path.dirname(project);
  console.log(chalk.dim(`Running "yarn link" in ${cwd}`));
  execa.sync('yarn', ['link'], {cwd, stdio: 'inherit'});
});
