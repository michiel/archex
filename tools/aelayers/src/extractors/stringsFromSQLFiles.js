const { extractAll } = require('../util');
const sqlFileExtractor = require('./stringsFromSQLFile');

async function extractor(path) {
  return extractAll(path, 'sql', sqlFileExtractor);
}

module.exports = extractor;
