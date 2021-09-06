function extractor(arr) {
  const statements = [];
  arr.forEach((str) => {
    let val = str;
    val = val.replace(/\#.*\n/g, '\n');
    val = val.replace(/\n/g, '');
    val = val.replace(/\s+/g, ' ');

    if (val.match(/INSERT|UPDATE|DELETE|SELECT|CREATE/)) {
      val.split(';').forEach((v) => {
        if (v !== '') {
          statements.push(v);
        }
      });
    }
  });
  return statements;
}

module.exports = extractor;
