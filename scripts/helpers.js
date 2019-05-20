const fs = require('fs');
const path = require('path');

const PACKAGES_DIR = path.resolve(__dirname, '../packages');

function getPackages() {
  return fs
    .readdirSync(PACKAGES_DIR)
    .map(file => path.resolve(PACKAGES_DIR, file))
    .filter(f => fs.lstatSync(path.resolve(f)).isDirectory());
}

module.exports = {
  getPackages,
  PACKAGES_DIR,
};
