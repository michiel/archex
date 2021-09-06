function sqlStatementsFromStrings(arr) {
  const lines = [];
  arr.forEach(line=> {
    if (line.match(/INSERT|UPDATE|DELETE|SELECT|CREATE/)) {
      val.split(';').forEach(v => lines.push(v));
    }
  });
  return lines;
}

modules.exports = {
  sqlStatementsFromStrings,
};
