const { extractAll } = require('../util');
const jsFileExtractor = require('./stringsFromJSFile');

async function extractor(path) {
  return extractAll(path, 'js', jsFileExtractor);
}

module.exports = extractor;
