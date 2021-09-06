const fs = require('fs');

function extractor(filename) {
  const data = fs.readFileSync(filename).toString();
  let lines = data.split('\n');
  lines = lines.map((line) => {
    return line.replace(/\#.*/, '');
  });
  lines = lines.map((line) => {
    return line.replace(/\t+/, ' ');
  });
  lines = lines.join(' ').split(';');

  return lines;
}

module.exports = extractor;
